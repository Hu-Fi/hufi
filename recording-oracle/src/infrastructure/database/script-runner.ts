import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import readline from 'readline/promises';
import { setTimeout as delay } from 'timers/promises';

import * as dotenv from 'dotenv';
import type { Constructor } from 'type-fest';
import { DataSource } from 'typeorm';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import '@/setup-libs';

import Environment from '@/common/utils/environment';
import logger from '@/logger';

import { CustomNamingStrategy } from './naming-strategy';
import type { DbScript } from './scripts/base';

dotenv.config({
  quiet: true,
  /**
   * First value wins if "override" option is not set
   */
  path: [`.env.${Environment.name}`, '.env'],
});

/**
 * NOTE: ts-node can't use dynamic imports that contain ts-paths,
 * so have to use this as a workaround to load scripts dynamically
 */
const __require = createRequire(__filename);

const runnerLogger = logger.child({ context: 'ScriptRunner' });

type ArgsOptions = {
  dryRun: boolean;
  revert: boolean;
};

async function parseOptions(): Promise<{ scriptName: string } & ArgsOptions> {
  const argv = await yargs(hideBin(process.argv))
    .version(false)
    .scriptName('yarn run:db-script')
    .usage('$0 <script-name> [options]')
    .command('$0 <script-name>', 'Run a database script', (yargs) =>
      yargs.positional('script-name', {
        type: 'string',
        describe: 'Script name to run',
      }),
    )
    .option('dry-run', {
      type: 'boolean',
      default: true,
      describe: 'Run without applying changes',
    })
    .option('revert', {
      type: 'boolean',
      default: false,
      describe: 'Run "revert" version of the script',
    })
    .help()
    .example('$0 ping', 'Ping DB connection')
    .parserConfiguration({
      'camel-case-expansion': true,
    })
    .parseAsync();

  return {
    scriptName: argv['script-name'] as string,
    dryRun: argv.dryRun,
    revert: argv.revert,
  };
}

async function resolveScriptPath(scriptName: string): Promise<string> {
  const scriptPath = path.resolve(__dirname, 'scripts', `${scriptName}.ts`);

  try {
    await fs.access(scriptPath);
  } catch {
    throw new Error(`Script "${scriptName}" not found at ${scriptPath}`);
  }

  return `./${path.relative(__dirname, scriptPath)}`;
}

async function loadScriptCtor(
  scriptName: string,
): Promise<Constructor<DbScript>> {
  const scriptPath = await resolveScriptPath(scriptName);

  const { default: ScriptCtor } = __require(scriptPath);

  const isCorrectImplementation = ['init', 'execute', 'revert'].every(
    (method) => typeof ScriptCtor.prototype[method] === 'function',
  );
  if (!isCorrectImplementation) {
    throw new Error('Incorrect DbScript implementation');
  }

  return ScriptCtor;
}

async function getUserConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    process.stdout.write('\n');
    const answerInput = await rl.question(
      `${message} Type "y" or "yes" to continue: `,
    );

    if (['y', 'yes'].includes(answerInput.trim().toLowerCase())) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  } finally {
    process.stdout.write('\n\n');
    rl.close();
  }
}

let dataSource: DataSource;
async function createDependencies(scriptName: string) {
  runnerLogger.debug('Initializing dependencies');

  const connectionUrl = process.env.POSTGRES_URL;
  if (!connectionUrl && !process.env.POSTGRES_HOST) {
    runnerLogger.error(
      'Database connection details are not provided. Please check your NODE_ENV or/and .env files',
    );
    throw new Error('Invalid DB connection details');
  }

  dataSource = new DataSource({
    type: 'postgres',
    useUTC: true,
    ...(connectionUrl
      ? {
          url: connectionUrl,
        }
      : {
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT),
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DATABASE,
        }),
    ssl: process.env.POSTGRES_SSL?.toLowerCase() === 'true',
    namingStrategy: new CustomNamingStrategy(),
  });

  try {
    await dataSource.initialize();
  } catch (error) {
    const errorMessage = 'Failed to initialize data source';
    runnerLogger.error(errorMessage, { error });
    throw new Error(errorMessage);
  }

  return {
    scriptLogger: runnerLogger.child({ scriptName }),
    queryRunner: dataSource.createQueryRunner(),
  };
}

async function cleanupDependencies() {
  runnerLogger.debug('Cleaning up dependencies');
  await dataSource?.destroy();
  runnerLogger.debug('Dependencies cleaned up');
}

let shutdownInProgress = false;
let cleanupTimeout: NodeJS.Timeout | undefined;
async function shutdown(signal?: string) {
  if (shutdownInProgress) {
    return;
  }
  shutdownInProgress = true;

  runnerLogger.info(`Received ${signal}, shutting down...`);

  cleanupTimeout = setTimeout(() => {
    runnerLogger.error('Cleanup timeout, forcing exit');
    process.exit(1);
  }, 10 * 1000);

  try {
    await cleanupDependencies();

    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
    }

    process.exit(0);
  } catch (error) {
    runnerLogger.error('Error during shutdown', error);

    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
    }

    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * yarn ts-node src/infrastructure/database/script-runner.ts
 */
void (async () => {
  try {
    let scriptName: string;
    let argsOptions: ArgsOptions;

    try {
      ({ scriptName, ...argsOptions } = await parseOptions());
    } catch (error) {
      runnerLogger.error('Error while parsing options', { error });
      return;
    }

    runnerLogger.debug('Parsed options', {
      scriptName,
      ...argsOptions,
    });

    const { scriptLogger, ...scriptDependencies } =
      await createDependencies(scriptName);

    let scriptCtor: Constructor<DbScript>;
    try {
      scriptLogger.debug('Loading script');
      scriptCtor = await loadScriptCtor(scriptName);
    } catch (error) {
      scriptLogger.error('Error while loading script', { error });
      return;
    }

    try {
      const script = new scriptCtor(
        scriptLogger,
        scriptDependencies.queryRunner,
      );
      await script.init();

      scriptLogger.info('Script executor initialized, going to run');

      if (argsOptions.dryRun) {
        runnerLogger.warn(
          'Running in "dry-run" mode, no actual changes should be applied',
        );
      } else {
        await delay(1000);
        const confirmed = await getUserConfirmation(
          `You are going to run "${scriptName}" script in live mode, actual changes will be applied. Do you want to continue?`,
        );
        if (confirmed) {
          runnerLogger.debug('"Live" mode confirmed, continuing');
          await delay(1000);
        } else {
          runnerLogger.debug('Script execution cancelled');
          return;
        }
      }

      const { revert, ...scriptOptions } = argsOptions;
      if (revert) {
        await script.revert(scriptOptions);
      } else {
        await script.execute(scriptOptions);
      }
    } catch (error) {
      scriptLogger.error('Error while running script', { scriptName, error });
    }
  } finally {
    await cleanupDependencies();
  }
})();
