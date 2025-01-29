import { parsers, printers, SqlFormatterOptions } from '../index';
import { ParserOptions, AstPath } from 'prettier';

// Mock AstPath for testing using type assertion
const createMockPath = (value: any): AstPath<any> => ({
  getValue: () => value,
  node: value
} as AstPath<any>);

describe('SQL Formatter', () => {
  const formatSQL = (input: string, formatterOptions: Partial<SqlFormatterOptions> = {}) => {
    const ast = parsers.sql.parse(input, {
      ...formatterOptions,
    } as ParserOptions<SqlFormatterOptions>);

    return printers.sql.print(
      createMockPath(ast),
      { sqlFormatter: { ...formatterOptions } } as any,
      () => []
    );
  };

  it('should format basic SQL query with default options', () => {
    const input = 'select id,name,email from users where status=1';
    expect(formatSQL(input)).toBe('SELECT id, name, email\nFROM users\nWHERE status = 1');
  });

  it('should handle keyword case options', () => {
    const input = 'SELECT id FROM users';
    
    expect(formatSQL(input, { keywordCase: 'upper' }))
      .toBe('SELECT id\nFROM users');
    
    expect(formatSQL(input, { keywordCase: 'lower' }))
      .toBe('select id\nfrom users');
  });

  it('should respect comma position setting', () => {
    const input = 'select id,name,email from users';
    
    const commaAfter = formatSQL(input, { commaPosition: 'after' });
    expect(commaAfter).toBe('SELECT id, name, email\nFROM users');
    
    const commaBefore = formatSQL(input, { commaPosition: 'before' });
    expect(commaBefore).toBe('SELECT id , name , email\nFROM users');
  });

  it('should handle complex queries', () => {
    const input = `
      select u.id,u.name,o.order_date 
      from users u 
      inner join orders o on u.id=o.user_id 
      where o.status='active' 
      group by u.id,u.name 
      having count(o.id)>5 
      order by o.order_date desc 
      limit 10
    `.trim();
    
    const formatted = formatSQL(input);
    expect(formatted).toBe(
      'SELECT u.id, u.name, o.order_date\n' +
      'FROM users u\n' +
      'INNER JOIN orders o ON u.id = o.user_id\n' +
      'WHERE o.status = \'active\'\n' +
      'GROUP BY u.id, u.name\n' +
      'HAVING count(o.id) > 5\n' +
      'ORDER BY o.order_date DESC\n' +
      'LIMIT 10'
    );
  });
});
