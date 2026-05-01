"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linearForecast = void 0;
const linearForecast = (prices) => {
    const n = prices.length;
    const x = [...Array(n).keys()];
    const y = prices;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return Math.round((slope * (n + 1) + intercept) * 100) / 100;
};
exports.linearForecast = linearForecast;
