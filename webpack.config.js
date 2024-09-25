const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, 'src/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    assetModuleFilename: '[name][ext]',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', '**', '*.{jpg,png,svg,ico,webmanifest}'),
          to({ context, absoluteFilename }) {
            const relativePath = path.relative(path.join(context, 'src'), absoluteFilename);
            return path.join(context, 'dist', relativePath);
          },
          context: __dirname,
          globOptions: {
            dot: false,
            ignore: ['**/node_modules/**'],
          },
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
  }
};
