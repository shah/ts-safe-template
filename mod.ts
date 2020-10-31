export interface TemplateLiteral {
  (
    literals: TemplateStringsArray,
    ...placeholders: string[]
  ): string;
}

export interface GovernedTemplatePartial {
  readonly placeholder: string | RegExp;
  readonly content: string;
}

export interface GoverendTemplateOptions {
  readonly bodyPlaceholderText: string;
  readonly escapeBodyContent: boolean;
  readonly partials?: GovernedTemplatePartial[];
}

export function defaultGovernedTemplateOptions(
  override?: Partial<GoverendTemplateOptions>,
): GoverendTemplateOptions {
  return {
    ...override,
    bodyPlaceholderText: override?.bodyPlaceholderText ||
      "<!-- BODY CONTENT GOES HERE -->",
    escapeBodyContent: override?.escapeBodyContent || false,
  };
}

export function governedTemplate(
  layoutSource: string,
  options: GoverendTemplateOptions = defaultGovernedTemplateOptions(),
): TemplateLiteral {
  const source = Deno.readTextFileSync(layoutSource);
  const { bodyPlaceholderText, escapeBodyContent, partials } = options;
  const [bodyStart, bodyEnd] = source.split(bodyPlaceholderText);
  return (literals: TemplateStringsArray, ...tmplLiteralArg: string[]) => {
    let result = "";
    for (let i = 0; i < tmplLiteralArg.length; i++) {
      result += literals[i];
      result += tmplLiteralArg[i];
    }
    result += literals[literals.length - 1];
    result = bodyStart +
      (escapeBodyContent ? escapeHtml(result) : result) +
      bodyEnd;

    if (partials) {
      for (const partial of partials) {
        result = result.replaceAll(partial.placeholder, partial.content);
      }
    }
    return result;
  };
}

export function htmlTag(
  tagName: string,
  escapeResult = false,
): TemplateLiteral {
  return (literals: TemplateStringsArray, ...placeholders: string[]) => {
    let result = "";
    for (let i = 0; i < placeholders.length; i++) {
      result += literals[i];
      result += placeholders[i];
    }
    result += literals[literals.length - 1];
    return `<${tagName}>` + (escapeResult ? escapeHtml(result) : result) +
      `</${tagName}>`;
  };
}

export function htmlEscape(
  literals: TemplateStringsArray,
  ...placeholders: string[]
) {
  let result = "";
  for (let i = 0; i < placeholders.length; i++) {
    result += literals[i];
    result += placeholders[i];
  }
  result += literals[literals.length - 1];
  return escapeHtml(result);
}

export function htmlEscapePlaceholders(
  literals: TemplateStringsArray,
  ...placeholders: string[]
) {
  let result = "";
  for (let i = 0; i < placeholders.length; i++) {
    result += literals[i];
    result += escapeHtml(placeholders[i]);
  }
  result += literals[literals.length - 1];
  return result;
}

/*!
 * escape-html from https://github.com/ako-deno/escape_html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * Copyright (c) 2020 Henry Zhuang
 * MIT Licensed
 */

const matchHtmlRegExp = /["'&<>]/;

/**
 * Escape special characters in the given string of text.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */
export function escapeHtml(string: string): string {
  const str = "" + string;
  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let escape;
  let html = "";
  let index = 0;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = "&quot;";
        break;
      case 38: // &
        escape = "&amp;";
        break;
      case 39: // '
        escape = "&#39;";
        break;
      case 60: // <
        escape = "&lt;";
        break;
      case 62: // >
        escape = "&gt;";
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}
