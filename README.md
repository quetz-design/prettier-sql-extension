# Prettier SQL Formatter Plugin

A Prettier plugin for formatting SQL code with customizable formatting options. This plugin enables consistent SQL code formatting across your projects using Prettier.

## Installation

Install the plugin along with Prettier:

```bash
npm install --save-dev prettier prettier-plugin-sql-format
# or using yarn
yarn add --dev prettier prettier-plugin-sql-format
```

## Usage

The plugin will be automatically loaded by Prettier. You can format SQL files using Prettier's standard commands:

```bash
# Format a file
prettier --write "**/*.sql"

# Check formatting
prettier --check "**/*.sql"
```

## Configuration

Add these options to your `.prettierrc` file or Prettier configuration:

```json
{
  "sqlFormatter": {
    "keywordCase": "upper",
    "indentStyle": "standard",
    "linesBetweenQueries": 1,
    "maxColumnLength": 50,
    "commaPosition": "after"
  }
}
```

### Options

#### `keywordCase`
- Type: `"upper" | "lower" | "preserve"`
- Default: `"upper"`
- Description: Controls the case of SQL keywords

#### `indentStyle`
- Type: `"standard" | "tabular"`
- Default: `"standard"`
- Description: Determines the indentation style for SQL statements

#### `linesBetweenQueries`
- Type: `number`
- Default: `1`
- Description: Number of blank lines to insert between queries

#### `maxColumnLength`
- Type: `number`
- Default: `50`
- Description: Maximum length for columns before wrapping

#### `commaPosition`
- Type: `"before" | "after" | "preserve"`
- Default: `"after"`
- Description: Controls the position of commas in column lists

## Examples

### Input:
```sql
select id,name,email from users where status=1
```

### Output:
```sql
SELECT id, name, email
FROM users
WHERE status = 1
```

### With Different Options:

#### Lower case keywords:
```json
{
  "sqlFormatter": {
    "keywordCase": "lower"
  }
}
```
```sql
select id, name, email
from users
where status = 1
```

#### Leading commas:
```json
{
  "sqlFormatter": {
    "commaPosition": "before"
  }
}
```
```sql
SELECT id
  , name
  , email
FROM users
WHERE status = 1
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Run tests: `npm test`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
