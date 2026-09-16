<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | Thenisai Palkova &amp; Sweets</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <style type="text/css">
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #2d3748;
            background-color: #f7fafc;
            line-height: 1.6;
            padding: 30px 20px;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%);
            color: #ffffff;
            padding: 32px 36px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
          }
          .header-brand {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .header-logo {
            height: 52px;
            width: auto;
            max-width: 200px;
            object-fit: contain;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
          }
          .header-title h1 {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
          }
          .header-title p {
            font-size: 14px;
            opacity: 0.9;
          }
          .header-badge {
            background: rgba(255,255,255,0.15);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.25);
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .notice-bar {
            background: #fef3c7;
            border-bottom: 1px solid #fde68a;
            color: #92400e;
            padding: 14px 36px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }
          .notice-bar a {
            color: #78350f;
            font-weight: 600;
            text-decoration: none;
          }
          .notice-bar a:hover {
            text-decoration: underline;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            padding: 28px 36px 12px 36px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
          }
          .stat-number {
            font-size: 28px;
            font-weight: 700;
            color: #9a3412;
            line-height: 1.1;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
            font-weight: 600;
          }
          .table-container {
            padding: 16px 36px 36px 36px;
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          thead th {
            text-align: left;
            padding: 14px 16px;
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
            border-bottom: 2px solid #cbd5e1;
            font-size: 13px;
          }
          tbody td {
            padding: 16px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          tbody tr:hover {
            background-color: #f8fafc;
          }
          .url-link {
            color: #0369a1;
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;
          }
          .url-link:hover {
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-priority {
            background: #dcfce7;
            color: #166534;
          }
          .badge-freq {
            background: #e0f2fe;
            color: #075985;
          }
          .badge-images {
            background: #fef3c7;
            color: #92400e;
            margin-bottom: 6px;
          }
          .image-list {
            list-style: none;
            margin-top: 6px;
            font-size: 12px;
            color: #475569;
          }
          .image-list li {
            padding: 2px 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .image-list li::before {
            content: "•";
            color: #d97706;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 13px;
            color: #64748b;
            padding: 20px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">
              <img src="/logo-light.png" alt="Thenisai Palkova &amp; Sweets" class="header-logo" />
              <div class="header-title">
                <h1>Thenisai Palkova &amp; Sweets</h1>
                <p>Official XML Sitemap for Search Engines (Google, Bing, Yahoo)</p>
              </div>
            </div>
            <div class="header-badge">
              Sitemap Index
            </div>
          </div>

          <div class="notice-bar">
            <span>ℹ️ This XML sitemap is generated for search engine bots. It helps search engines discover and index our pages.</span>
            <a href="https://thenisaisweets.com/">Back to Website →</a>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
              </div>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url/image:image)"/>
              </div>
              <div class="stat-label">Indexed Brand Logo</div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 45%;">URL</th>
                  <th style="width: 12%;">Priority</th>
                  <th style="width: 15%;">Change Frequency</th>
                  <th style="width: 15%;">Last Modified</th>
                  <th style="width: 13%;">Images</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <a class="url-link" href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                      <xsl:if test="xhtml:link">
                        <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
                          <strong>Languages:</strong>
                          <xsl:for-each select="xhtml:link">
                            <span style="margin-left: 6px;"><xsl:value-of select="@hreflang"/></span>
                          </xsl:for-each>
                        </div>
                      </xsl:if>
                    </td>
                    <td>
                      <span class="badge badge-priority">
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-freq">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </span>
                    </td>
                    <td style="color: #64748b; font-size: 13px;">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                    <td>
                      <xsl:choose>
                        <xsl:when test="image:image">
                          <span class="badge badge-images">
                            <xsl:value-of select="count(image:image)"/> logo
                          </span>
                          <ul class="image-list">
                            <xsl:for-each select="image:image">
                              <li>
                                <xsl:value-of select="image:title"/>
                              </li>
                            </xsl:for-each>
                          </ul>
                        </xsl:when>
                        <xsl:otherwise>
                          <span style="color: #94a3b8; font-size: 13px;">—</span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>

        <div class="footer">
          Thenisai Palkova &amp; Sweets — Nattamai Kottai, Krishnagiri, Tamil Nadu 635001 | NH 44 (Bangalore–Salem Highway)
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>