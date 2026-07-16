const fs = require('fs');

const dbPath = 'E:/Portifolio/Cinefilo/app/src/services/database.ts';
let content = fs.readFileSync(dbPath, 'utf8');

content = content.replace(
  /async saveMovieStatus\(userId: string, movieId: number, status: string, movieData: any, rating: number = 0, review: string = ""\)/g,
  'async saveMovieStatus(userId: string, movieId: number, status: string, movieData: any, rating: number = 0, review: string = "", has_spoiler: boolean = false)'
);

content = content.replace(
  /rating,\s*review,\s*emotions:/g,
  'rating,\n                review,\n                has_spoiler,\n                emotions:'
);

fs.writeFileSync(dbPath, content);
console.log('Done');
