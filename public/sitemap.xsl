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
        <link rel="icon" type="image/png" href="/logo-icon.png" />
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
          .header-brand img {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #fff;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .header h1 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.01em;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 13px;
            opacity: 0.9;
          }
          .badge {
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.3);
            color: #fff;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-banner {
            background: #fffbeb;
            border-bottom: 1px solid #fef3c7;
            padding: 16px 36px;
            font-size: 13px;
            color: #92400e;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }
          .info-banner a {
            color: #b45309;
            font-weight: 600;
            text-decoration: underline;
          }
          .stats {
            display: flex;
            gap: 16px;
            padding: 24px 36px 12px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 20px;
            min-width: 140px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #9a3412;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table-wrap {
            padding: 12px 36px 36px;
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 2px solid #cbd5e1;
            white-space: nowrap;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          tr:hover td {
            background-color: #f8fafc;
          }
          .url-link {
            color: #0369a1;
            font-weight: 600;
            text-decoration: none;
            word-break: break-all;
          }
          .url-link:hover {
            text-decoration: underline;
            color: #0284c7;
          }
          .pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }
          .pill-priority { background: #dcfce7; color: #15803d; }
          .pill-freq { background: #e0f2fe; color: #0369a1; }
          .pill-images { background: #fef3c7; color: #92400e; }
          .image-list {
            margin-top: 8px;
            padding-left: 18px;
            font-size: 12px;
            color: #64748b;
          }
          .image-list li {
            margin-bottom: 4px;
          }
          .footer-note {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-brand">
              <img src="/logo-icon.png" alt="Thenisai Logo" />
              <div>
                <h1>Thenisai Palkova &amp; Sweets</h1>
                <p>Official XML Sitemap for Search Engines (Google, Bing, Yahoo)</p>
              </div>
            </div>
            <div class="badge">Sitemap Index</div>
          </div>

          <div class="info-banner">
            <span>ℹ️ This XML sitemap is generated for search engine bots. It helps search engines discover and index our pages.</span>
            <a href="https://thenisaisweets.com/">Back to Website →</a>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat-card">
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url/image:image)"/></div>
              <div class="stat-label">Indexed Images</div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">URL</th>
                  <th>Priority</th>
                  <th>Change Frequency</th>
                  <th>Last Modified</th>
                  <th>Images</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <a class="url-link" href="{sitemap:loc}" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                      <xsl:if test="xhtml:link">
                        <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
                          <strong>Languages: </strong>
                          <xsl:for-each select="xhtml:link">
                            <span style="margin-right: 6px;"><xsl:value-of select="@hreflang"/></span>
                          </xsl:for-each>
                        </div>
                      </xsl:if>
                    </td>
                    <td>
                      <span class="pill pill-priority"><xsl:value-of select="sitemap:priority"/></span>
                    </td>
                    <td>
                      <span class="pill pill-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                    </td>
                    <td style="color: #64748b;">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                    <td>
                      <span class="pill pill-images">
                        <xsl:value-of select="count(image:image)"/> images
                      </span>
                      <xsl:if test="image:image">
                        <ul class="image-list">
                          <xsl:for-each select="image:image">
                            <li>
                              <a href="{image:loc}" target="_blank" style="color: #0369a1; text-decoration: none;">
                                <xsl:value-of select="image:title"/>
                              </a>
                            </li>
                          </xsl:for-each>
                        </ul>
                      </xsl:if>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="footer-note">
            Thenisai Palkova &amp; Sweets — Nattamai Kottai, Krishnagiri, Tamil Nadu 635001 | NH 44 (Bangalore–Salem Highway)
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
