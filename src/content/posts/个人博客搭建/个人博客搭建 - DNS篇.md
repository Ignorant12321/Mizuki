---

title: 个人博客搭建 - DNS篇

published: 2026-02-03

updated: 2026-02-03

description: 'DNS的名词解析，阿里云如何为服务器添加解析'

image: ''

tags: [Blogging,Freshman,DNS]

category: 'Experience'

draft: false

---

# 个人博客搭建 - DNS篇

## 名词解析

DNS：互联网的“电话簿”，将域名（联系人）和IP地址（电话号）进行映射【[DNS是什么？史上最易懂的介绍 - 知乎](https://zhuanlan.zhihu.com/p/6586190787)】

常见的DNS解析记录类型表格【本表格由Gemini Pro生成】

| **记录类型** | **全称 (Full Name)** | **典型应用场景**                                             |
| ------------ | -------------------- | ------------------------------------------------------------ |
| **A**        | Address              | 最基础的记录。例如将 `example.com` 指向服务器 IP `192.0.2.1`。解析后，访问 `example.com` 网站即访问 `192.0.2.1`的服务器。 |
| **AAAA**     | IPv6 Address         | 与 A 记录功能相同，但用于新一代的 128 位 IP 地址。           |
| **CNAME**    | Canonical Name       | 当你希望 `www.example.com` 和 `example.com` 指向同一处，且不想维护两个 IP 时使用。解析后，访问 `www.example.com` 网站即访问 `example.com`的服务器。 |
| **TXT**      | Text                 | 用于SSL 证书验证或 Google/Microsoft 域名所有权验证。         |
| **NS**       | Name Server          | 告诉互联网，“这个域名的解析工作由哪家 DNS 服务商（如 Cloudflare, AWS）负责”。 |

## DNS解析

购买服务器后，会获得服务器的公网IP，访问此IP即可访问该服务器【HTTP访问的是80端口，HTTPS访问的是443端口】。

因为笔者是在阿里云购买的域名，所以直接在域名管理点击解析，添加解析即可

![DNS解析](https://cdn.218501.xyz/2026/02/a1892d949f3e859ff44a8f2ab3905740.webp)

添加`www`和`@`记录，即分别将服务器的IP地址【公网IP】解析到`www.example.com` 和 `example.com` 上。

阿里云还提供了域名解析是否生效的服务：[阿里云网站运维检测平台](https://boce.aliyun.com/detect/dns)

笔者因为申请了`Cloudflare`的`R2`存储服务，需要将DNS服务商从阿里云转到CF上，所以国内解析时间有点慢，国外相对较快。

![解析时间](https://cdn.218501.xyz/2026/02/7473af4972b245e50a6797baa1cc2b15.webp)

至此，DNS生效后，输入域名就可访问自己的网站【前提是自己的网站已经搭建好】。生效时间可以参考：[ 域名解析大概多久生效？一文搞清楚解析生效时间那些事 - 知乎](https://zhuanlan.zhihu.com/p/704474191)
