const Dotenv = require('dotenv-webpack');
module.exports = {
    plugins: [
        new Dotenv(),
        new webpack.ProvidePlugin({
          process: 'process/browser',
          // Other plugins...
        }),
    ],
    resolve: {
        fallback: {
            "vm": require.resolve("vm-browserify"),
            'process/browser': require.resolve('process/browser'),
        }
    }
}