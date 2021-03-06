import { parse } from 'querystring';

const queryParser = (url: string) => {
  url = decodeURIComponent(url);

  const index = url.indexOf('?');
  const queryStr = index === -1 ? '' : url.substr(index + 1);

  return parse(queryStr);
};

export default queryParser;
