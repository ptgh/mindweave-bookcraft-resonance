module.exports = [
  {
    name: 'Main Bundle',
    path: 'dist/assets/index-*.js',
    limit: '300 KB',
    webpack: false,
    gzip: true,
  },
  {
    name: 'CSS Bundle',
    path: 'dist/assets/index-*.css',
    limit: '50 KB',
    webpack: false,
    gzip: true,
  },
  {
    name: 'Total App Size',
    path: 'dist/**/*.{js,css}',
    limit: '400 KB',
    webpack: false,
    gzip: true,
  },
];
