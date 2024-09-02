const path = require('path');

module.exports = {
    mode: 'development', // or 'production'
    entry: './src/main/frontend/index.jsx',
    output: {
        path: path.resolve(__dirname, 'out-html'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.s?css$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.html$/,
                use: 'html-loader',
            },
            {
                test: /\.(woff|woff2)$/,
                type: 'asset/inline',
                // mimeType option can be used if needed
            },
            {
                test: /\.ttf$/,
                type: 'asset/resource',
                // mimeType option can be used if needed
            },
            {
                test: /\.eot$/,
                type: 'asset/resource',
            },
            {
                test: /\.svg$/,
                type: 'asset/inline',
                // mimeType option can be used if needed
            },
            {
                test: /\.(png|jpg)$/,
                type: 'asset/inline',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8192, // Inline files smaller than 8kB
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'out-html'),
        },
        port: 9000,
        hot: true, // Enable Hot Module Replacement
        open: true, // Automatically open the browser
    },
};
