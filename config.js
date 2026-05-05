const CONFIG = {
  // rss2json.com 経由でCORS回避してRSSをJSONに変換
  RSS2JSON_API: 'https://api.rss2json.com/v1/api.json?rss_url=',

  // RSSソース一覧
  RSS_SOURCES: [
    {
      name: 'HRpro',
      url: 'https://www.hrpro.co.jp/rss.xml',
    },
    {
      name: 'HR NOTE',
      url: 'https://hrnote.jp/feed/',
    },
    {
      name: 'ワークス研究所',
      url: 'https://www.works-i.com/research/rss.xml',
    },
    {
      name: 'マイナビニュース',
      url: 'https://news.mynavi.jp/rss/career',
    },
    {
      name: 'HR AGE',
      url: 'https://hr-age.com/feed/',
    },
  ],

  // カテゴリ定義（keywordsにマッチしたらそのカテゴリに分類）
  // 上から順に評価し、最初にマッチしたカテゴリを使用
  CATEGORIES: [
    {
      id: 'it',
      label: 'IT・テック',
      keywords: ['エンジニア', 'IT', 'ソフトウェア', 'DX', 'デジタル', '開発職', 'システム', 'プログラム', 'テック'],
    },
    {
      id: 'manufacturing',
      label: '製造・メーカー',
      keywords: ['製造', 'メーカー', '工場', 'ものづくり', '生産', '機械', '電機'],
    },
    {
      id: 'food',
      label: '食品・消費財',
      keywords: ['食品', '飲料', '消費財', '食品メーカー', '飲食'],
    },
    {
      id: 'chemistry',
      label: '化学・素材',
      keywords: ['化学', '素材', '材料', '樹脂', '化成品'],
    },
    {
      id: 'medical',
      label: '医療・バイオ',
      keywords: ['医療', 'バイオ', '製薬', '医薬品', '創薬', '臨床'],
    },
    {
      id: 'construction',
      label: '建設・インフラ',
      keywords: ['建設', 'インフラ', '土木', '建築', '不動産'],
    },
    {
      id: 'general',
      label: '採用全般',
      keywords: [], // 上記どれにも当てはまらない記事
    },
  ],
};
