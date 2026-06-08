import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import readline from 'readline/promises';
import { setTimeout as delay } from 'timers/promises';

import type { Constructor } from 'type-fest';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import '@/setup-libs';

import logger from '@/logger';

import type { DbScript } from './scripts/base';

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
    process.stdout.write('\n');

    if (['y', 'yes'].includes(answerInput.trim().toLowerCase())) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  } finally {
    rl.close();
  }
}

/**
 * yarn ts-node src/infrastructure/database/script-runner.ts
 */
void (async () => {
  let scriptName: string;
  let argsOptions: ArgsOptions;

  try {
    ({ scriptName, ...argsOptions } = await parseOptions());
  } catch (error) {
    runnerLogger.error('Error while parsing options', { error });
    process.exit(1);
  }

  runnerLogger.debug('Parsed options', {
    scriptName,
    ...argsOptions,
  });
  /**
   * To get the log message above before confirmation prompt
   */
  await delay(1000);

  if (argsOptions.dryRun) {
    runnerLogger.warn(
      'Running in "dry-run" mode, no actual changes should be applied',
    );
  } else {
    const confirmed = await getUserConfirmation(`
      You are going to run "${scriptName}" script in live mode,
      actual changes will be applied. Do you want to continue?
    `);
    if (confirmed) {
      runnerLogger.debug('"Live" mode confirmed, continuing');
      await delay(2500);
    } else {
      runnerLogger.debug('Script execution cancelled');
      process.exit(0);
    }
  }

  const scriptLogger = runnerLogger.child({ scriptName });
  try {
    scriptLogger.debug('Loading script', {
      options: argsOptions,
    });
    const scriptCtor = await loadScriptCtor(scriptName);

    scriptLogger.info('Script executor loaded, initializing');

    const script = new scriptCtor(scriptLogger);
    await script.init();

    scriptLogger.info('Script executor initialized, going to run');

    const { revert, ...scriptOptions } = argsOptions;
    if (revert) {
      await script.revert(scriptOptions);
    } else {
      await script.execute(scriptOptions);
    }

    process.exit(0);
  } catch (error) {
    scriptLogger.error('Error while running script', { error });
    process.exit(1);
  }
})();
