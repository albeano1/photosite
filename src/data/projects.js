export const projects = [
  {
    title: 'Earnings Intel',
    description:
      'LLM-based earnings intelligence from SEC filings and market data. Extracts structured signals (sentiment shift, uncertainty, guidance, tone), benchmarks them against forward returns and lexical baselines, and exports factor-lab CSVs with point-in-time panels, IC decay, and walk-forward validation.',
    tech: ['Python', 'Pandas', 'LLM'],
    link: 'https://github.com/albeano1/LLM-Based-Earnings-Call-Intelligence-System',
    image: null,
  },
  {
    title: 'Cap 100',
    description:
      'Production NBA draft game with ranked leaderboards, 1v1 matchmaking, and Monte Carlo season simulation under a 100 PPG cap. Full stack: React SPA, Express APIs, ridge projection models, and Postgres.',
    tech: ['React', 'Express', 'Postgres'],
    link: 'https://cap100game.com/',
    image: null,
  },
  {
    title: 'Factor-investing tool',
    description:
      'Python research pipeline that ingests public equity data, across multiple factors momentum, mean reversion, volatility, measures predictive power with IC and horizon decay, and backtests portfolios with turnover based costs, and walk forward splits',
    tech: ['Python'],
    link: 'https://github.com/albeano1/Factor-investing',
    image: null,
  },
  {
    title: 'Limit Order Book',
    description:
      'Python limit order book and market microstructure simulator with price-time priority, market and limit orders, stochastic latency, and taker/maker fees. Tracks spread and slippage, supports optional Numba acceleration, historical replay, and execution algos (TWAP / VWAP).',
    tech: ['Python', 'NumPy', 'Numba'],
    link: 'https://github.com/albeano1/Limit-Order-Book',
    image: null,
  },
  {
    title: 'Risk Engine',
    description:
      'Python library for portfolio risk analytics: covariance estimation (Ledoit-Wolf, factor models), historical and parametric VaR/CVaR, mean-variance and risk-parity optimization, Black-Litterman views, plus stress testing and scenario analysis.',
    tech: ['Python', 'Pandas', 'NumPy'],
    link: 'https://github.com/albeano1/Risk-engine-analytical-portfolio-',
    image: null,
  },
  {
    title: 'Real-Time Streaming Alpha',
    description:
      'Live market data pipeline: Polygon WebSocket ingestion through Kafka, rolling tick features, online sklearn signals, and a paper execution simulator with slippage and position limits. React dashboard shows pipeline stages, prices, alpha, and manual or auto-trade on play money.',
    tech: ['Python', 'React', 'Kafka', 'Docker'],
    link: 'https://github.com/albeano1/Real-time-market-stream',
    image: null,
  },
]

export const projectsWithLinks = projects.filter(
  (p) => typeof p.link === 'string' && p.link.trim() !== ''
)

export function pickRandomProject() {
  const pool = projectsWithLinks.length > 0 ? projectsWithLinks : projects
  return pool[Math.floor(Math.random() * pool.length)]
}
