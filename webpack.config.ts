import path from 'path';
import webpack, { ProvidePlugin } from 'webpack';
import TSConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HTMLPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import 'webpack-dev-server';

const isDev = process.env.NODE_ENV === 'development';
const extensions = ['.js', '.ts', '.jsx', '.tsx'];

function getFilename(ext: string) {
    const fixedExt = ext.replace(/^\./, '');

    return isDev ? `[name].${ext}` : `${fixedExt}/[name].[contenthash].${fixedExt}`;
}

function getCssLoaders(...loaders: webpack.RuleSetUseItem[]) {
    const cssLoaders: webpack.RuleSetRule['use'] = [
        isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
            loader: 'css-loader',
            options: {
                modules: {
                    localIdentName: isDev ? '[name]__[local]--[hash:base64:5]' : '[hash:base64:6]',
                },
            },
        },
    ];

    if (loaders !== undefined) {
        cssLoaders.push(...loaders);
    }

    return cssLoaders;
}

const config: webpack.Configuration = {
    target: 'web',
    context: path.resolve(__dirname, 'src'),
    entry: {
        index: './index.tsx',
    },
    output: {
        filename: getFilename('.js'),
        chunkFilename: getFilename('.js'),
        path: path.resolve(__dirname, 'build'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.css/,
                use: getCssLoaders(),
            },
            {
                test: /\.s[ac]ss$/,
                use: getCssLoaders('sass-loader'),
            },
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    plugins: [
        new ProvidePlugin({
            React: 'react',
        }),
        new HTMLPlugin({ template: path.resolve(__dirname, 'public/index.html') }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public/favicon.*'),
                    to: path.resolve(__dirname, 'build/favicon.png'),
                    noErrorOnMissing: true,
                },
            ],
        }),
        new MiniCssExtractPlugin({
            filename: getFilename('.css'),
        }),
        new ForkTsCheckerPlugin({
            typescript: {
                configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
        }),
        new ESLintPlugin({ extensions }),
    ],
    resolve: {
        extensions,
        plugins: [new TSConfigPathsPlugin()],
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
        },
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    compress: {
                        drop_console: true,
                    },
                },
                extractComments: false,
            }),
            new CssMinimizerPlugin(),
        ],
    },
    devServer: {
        port: 3000,
        hot: true,
    },
    devtool: isDev ? 'eval-cheap-source-map' : undefined,
    stats: isDev ? 'minimal' : 'normal',
};

export default config;
