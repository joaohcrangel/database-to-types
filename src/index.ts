import mysql, { Connection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DIR_OUT = 'output';
const DATABASE = 'b2mcore';

function createFile(name: string, content: string) {
  const filename = `${name}.ts`;
  if (!fs.existsSync(path.resolve(__dirname, '../', DIR_OUT))) {
    fs.mkdirSync(path.resolve(__dirname, '../', DIR_OUT));
  }
  return fs.writeFileSync(
    `${path.resolve(__dirname, '../', DIR_OUT, filename)}`,
    content
  );
}

function getType(column: any) {
  if (column.type === 'int') {
    return 'number';
  } else if (column.type === 'datetime') {
    return 'string';
  } else {
    return 'string';
  }
}

function getIsOptional(column: any) {
  return column.IS_NULLABLE ? '?' : '';
}

function getTypeLine(column: any) {
  return `${column.COLUMN_NAME}${getIsOptional(column)}: ${getType(column)};`;
}

function createType(tableName: string, columns: any[]) {
  return `export type ${tableName} = { ${columns.map(getTypeLine).join(' ')} }`;
}

async function getTable(connection: Connection, name: string) {
  const [rows] = await connection.execute(
    `
        SELECT column_name, is_nullable, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = '${DATABASE}' AND table_name = '${name}'
        ORDER BY ordinal_position;
    `
  );

  return (rows as any).map((row: any) => {
    row.IS_NULLABLE = row.IS_NULLABLE === 'YES';
    return row;
  });
}

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'b2mcore',
    password: 'r00t14789632',
  });

  const [tables] = await connection.execute(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${DATABASE}' AND table_name NOT IN('_prisma_migrations');`
  );

  for (const table of tables as any[]) {
    const columns = await getTable(connection, table['TABLE_NAME']);

    createFile(table['TABLE_NAME'], createType(table['TABLE_NAME'], columns));
  }
}

main()
  .then(() => console.log('finish'))
  .catch(console.error);
