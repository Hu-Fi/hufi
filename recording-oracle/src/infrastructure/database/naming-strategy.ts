import { snakeCase } from 'lodash';
import { DefaultNamingStrategy } from 'typeorm';

export class CustomNamingStrategy extends DefaultNamingStrategy {
  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    const name = customName || snakeCase(propertyName);

    if (embeddedPrefixes.length) {
      return snakeCase(embeddedPrefixes.concat('').join('_')) + name;
    }

    return name;
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(super.joinColumnName(relationName, referencedColumnName));
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(
      super.joinTableColumnName(tableName, propertyName, columnName),
    );
  }
}
