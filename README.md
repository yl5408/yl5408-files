# YL5408 下载中心

这是一个适合部署到 Cloudflare Pages 的静态个人下载站。建议绑定到子域名 `files.yl5408.cn`。网站不需要服务器、数据库、账号系统或后台，下载文件先放在 GitHub Releases，后续文件多了再迁移到 Cloudflare R2。

## 文件结构

```text
index.html          首页
style.css           样式
script.js           文件列表渲染和搜索筛选
files.json          下载文件数据
assets/             图片资源
_headers            Cloudflare Pages 响应头
404.html            404 页面
robots.txt          搜索引擎规则
```

## 修改站点信息

打开 `index.html`，把这些内容改成你的正式信息：

```text
YL5408 下载中心
Files Hub
hello@example.com
```

推荐域名结构：

```text
yl5408.cn          总站
files.yl5408.cn    下载中心
```

## 添加下载文件

打开 `files.json`，复制其中一个对象，然后修改：

```json
{
  "id": "my-tool-windows",
  "name": "我的工具",
  "version": "v1.0.0",
  "category": "软件",
  "platform": "Windows",
  "size": "28.4 MB",
  "updated": "2026-06-24",
  "description": "一句话说明这个文件是什么。",
  "url": "https://github.com/你的用户名/你的仓库/releases/download/v1.0.0/my-tool.zip",
  "checksum": "SHA256: 你的校验值",
  "status": "ready"
}
```

`status` 为 `ready` 时显示下载按钮，`draft` 时显示待上传。

## GitHub Releases 放文件

1. 在 GitHub 新建一个仓库，例如 `downloads`。
2. 进入仓库的 `Releases`。
3. 创建一个版本，例如 `v1.0.0`。
4. 上传 `.zip`、`.exe`、`.7z` 等文件。
5. 复制文件下载链接，填入 `files.json` 的 `url`。

## Cloudflare Pages 部署

1. 把这个文件夹上传到 GitHub 仓库。
2. 打开 Cloudflare，进入 `Workers & Pages`。
3. 创建 Pages 项目，连接这个 GitHub 仓库。
4. 构建命令留空。
5. 输出目录填 `/` 或保持默认根目录。
6. 部署完成后，Cloudflare 会给一个 `pages.dev` 地址。

## 绑定子域名

1. 在腾讯云购买 `.cn` 域名并完成域名实名认证。
2. 在 Cloudflare 添加你的域名。
3. Cloudflare 会给两个 nameserver。
4. 回腾讯云域名管理，把 DNS 服务器改成 Cloudflare 给的 nameserver。
5. 回 Cloudflare Pages，给下载站项目添加自定义域名 `files.yl5408.cn`。
6. 等待 DNS 生效后访问你的域名。

## 后续迁移到 Cloudflare R2

后面文件变多时，把文件上传到 R2 bucket，再把公开文件 URL 填入 `files.json` 的 `url`。网站代码不用大改，域名也可以保持不变。

## 当前成本

```text
腾讯云 .cn 域名：约 30-40 元/年
Cloudflare Pages：免费档
GitHub Releases：免费
```
