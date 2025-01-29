import { Parser, Printer, SupportLanguage, ParserOptions, Doc, AstPath } from 'prettier';
import { format } from 'sql-formatter';

export const languages: SupportLanguage[] = [
  {
    name: 'SQL',
    parsers: ['sql'],
    extensions: ['.sql'],
    vscodeLanguageIds: ['sql'],
  },
];

export interface SqlFormatterOptions {
  keywordCase?: 'upper' | 'lower' | 'preserve';
  indentStyle?: 'standard' | 'tabular';
  linesBetweenQueries?: number;
  maxColumnLength?: number;
  commaPosition?: 'before' | 'after' | 'preserve';
}

interface SqlNode {
  type: 'sql';
  value: string;
}

interface PrinterOptions extends ParserOptions<any> {
  sqlFormatter?: SqlFormatterOptions;
}

type SqlParserOptions = ParserOptions<SqlFormatterOptions>;

export const parsers: { [key: string]: Parser } = {
  sql: {
    parse(text: string, options: SqlParserOptions): SqlNode {
      return {
        type: 'sql',
        value: text,
      };
    },
    astFormat: 'sql',
    locStart: () => 0,
    locEnd: () => 0,
  },
};

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS',
  'UNION', 'ALL', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'PRIMARY KEY',
  'FOREIGN KEY', 'CONSTRAINT', 'DEFAULT', 'CASCADE'
].join('|');

const KEYWORD_REGEX = new RegExp(`\\b(${SQL_KEYWORDS})\\b`, 'gi');

const formatSqlString = (sql: string, options: SqlFormatterOptions = {}): string => {
  // Normalize whitespace
  let formattedSql = sql.replace(/\s+/g, ' ').trim();

  // Handle operators and parentheses spacing
  formattedSql = formattedSql
    .replace(/([=<>!]+)/g, ' $1 ')  // Space around operators
    .replace(/\s*,\s*/g, options.commaPosition === 'before' ? ' , ' : ', ')
    .replace(/\s*\(\s*/g, '(')      // No space before opening parenthesis
    .replace(/\s*\)\s*/g, ') ')     // Space after closing parenthesis
    .replace(/\s+/g, ' ');          // Normalize spaces

  // Handle function calls spacing
  formattedSql = formattedSql.replace(/(\w+)\s*\(/g, '$1(');

  // Update keyword list to include DESC/ASC
  const keywords = [
    ...SQL_KEYWORDS.split('|'),
    'DESC',
    'ASC'
  ].join('|');

  const keywordRegex = new RegExp(`\\b(${keywords})\\b`, 'gi');

  // Handle keyword casing
  if (options.keywordCase === 'upper' || !options.keywordCase) {
    formattedSql = formattedSql.replace(keywordRegex, match => match.toUpperCase());
  } else if (options.keywordCase === 'lower') {
    formattedSql = formattedSql.replace(keywordRegex, match => match.toLowerCase());
  }

  // Split the query into major parts while preserving JOIN...ON together
  const mainParts = formattedSql.split(/\b(SELECT|FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT)\b/i);
  const result = [];
  let currentPart = '';

  for (const part of mainParts) {
    if (!part.trim()) continue;

    const upperPart = part.trim().toUpperCase();
    if (['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'].includes(upperPart)) {
      if (currentPart) {
        result.push(currentPart.trim());
      }
      currentPart = part;
    } else {
      // Handle JOIN clauses
      const joinParts = part.split(/\b((?:INNER |LEFT |RIGHT |OUTER )?JOIN\b)/i);
      for (let i = 0; i < joinParts.length; i++) {
        const joinPart = joinParts[i].trim();
        if (!joinPart) continue;

        if (joinPart.toUpperCase().endsWith('JOIN')) {
          if (currentPart) {
            result.push(currentPart.trim());
          }
          currentPart = joinPart;
        } else if (i > 0 && joinParts[i-1].toUpperCase().endsWith('JOIN')) {
          // This is the part after JOIN keyword
          currentPart += ' ' + joinPart;
        } else {
          // Regular content
          currentPart += ' ' + joinPart;
        }
      }
    }
  }

  if (currentPart) {
    result.push(currentPart.trim());
  }

  // Final formatting pass
  return result
    .filter(Boolean)
    .map(clause => {
      if (clause.toUpperCase().includes('JOIN')) {
        // Handle ON keyword casing while preserving the rest
        const onKeyword = options.keywordCase === 'lower' ? 'on' : 'ON';
        return clause.replace(/\bON\b/gi, onKeyword);
      }
      return clause;
    })
    .join('\n');
};

export const printers: { [key: string]: Printer } = {
  sql: {
    print(
      path: AstPath<SqlNode>,
      options: PrinterOptions,
      print: (path: AstPath<any>) => Doc
    ): Doc {
      const node = path.getValue();
      const pluginOptions = options.sqlFormatter ?? {};
      return formatSqlString(node.value, pluginOptions);
    },
  },
};

export const defaultOptions = {
  keywordCase: 'upper' as const,
  indentStyle: 'standard' as const,
  linesBetweenQueries: 1,
  maxColumnLength: 50,
  commaPosition: 'after' as const,
};

export const options = {
  keywordCase: {
    type: 'choice',
    category: 'SQL',
    default: defaultOptions.keywordCase,
    description: 'Convert keywords to uppercase, lowercase, or preserve case',
    choices: [
      { value: 'upper', description: 'Convert keywords to uppercase' },
      { value: 'lower', description: 'Convert keywords to lowercase' },
      { value: 'preserve', description: 'Preserve keyword case' },
    ],
  },
  indentStyle: {
    type: 'choice',
    category: 'SQL',
    default: defaultOptions.indentStyle,
    description: 'SQL indentation style',
    choices: [
      { value: 'standard', description: 'Standard indentation' },
      { value: 'tabular', description: 'Tabular indentation for better readability' },
    ],
  },
  linesBetweenQueries: {
    type: 'int',
    category: 'SQL',
    default: defaultOptions.linesBetweenQueries,
    description: 'Number of blank lines between queries',
  },
  maxColumnLength: {
    type: 'int',
    category: 'SQL',
    default: defaultOptions.maxColumnLength,
    description: 'Maximum length for columns before wrapping',
  },
  commaPosition: {
    type: 'choice',
    category: 'SQL',
    default: defaultOptions.commaPosition,
    description: 'Position of commas in column lists',
    choices: [
      { value: 'before', description: 'Commas at the beginning of lines' },
      { value: 'after', description: 'Commas at the end of lines' },
      { value: 'preserve', description: 'Preserve comma positions' },
    ],
  },
};
