module.exports = {
  entry: {
    app: './src'
  },
  output: {
    path: './dist',
    filename: 'bundle.js',
    publicPath: '/'
  },
  devServer: {
    inline: true,
    contentBase: './dist',
    historyApiFallback: true
  },
  plugins: [],
  module: {
    loaders: [ {
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query:
        {
        presets:['es2015', 'react']
      }
    },
    ]
  }
}
