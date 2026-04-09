---

title: Mizuki部署

published: 2026-04-09

updated: 2026-04-09

description: '利用CloudFlare Pages 搭建 Mizuki 主题博客'

image: './Mizuki部署.webp'

tags: [blog,deploying]

category: 'Experience'

draft: false
---

# Mizuki部署

[toc]

## 前提

代码在本地跑通，不然部署会失败。

检测方法：`pnpm build`

预览方法：`pnpm preview` 然后打开对应端口即可

## CloudFlare Pages 部署

> MIzuki主题部署官方指南见：[Cloudflare Pages 部署 | Mizuki Next Theme](https://docs.mizuki.mysqil.com/guide/deploy/Cloudflare/)

### 打开CloudFlare

选择`计算`的`Workers 和 Pages`选项卡

点击`创建程序应用`

![image-20260409165951529](https://cdn.218501.xyz/2026/04/0822c976fffb74433559b7ca118d1a32.png)

### 开始使用Pages

![image-20260409170053504](https://cdn.218501.xyz/2026/04/23a0138b0c2545818fd56fb9152ba24f.png)

### 添加账户并链接项目

#### 添加账户

![image-20260409170103900](https://cdn.218501.xyz/2026/04/49588350464bf7cfd055d4f15f9a93d9.png)

#### 选择项目

添加博客项目【当然也可以选择`All repositories`】，然后选择`Save`

![image-20260409170122998](https://cdn.218501.xyz/2026/04/914cf84104fec680d9270406977b2d7f.png)

#### 开始设置

![image-20260409170132566](https://cdn.218501.xyz/2026/04/55aa6faaa8a0546a89cc69e3ec129a29.png)

### 设置构建和部署

1. 设置项目名称
2. 选择项目分支
3. 框架预设：`Astro`
4. 构建命令：`pnpm i && pnpm build`
5. 构建输出目录默认为：`dist`
6. 其他功能看情况选择（一般不用设置）
7. 点击`保存并部署`

![image-20260409170142072](https://cdn.218501.xyz/2026/04/a5b45bbcc8dabee674e781e7f880cfda.png)

### 结果展示

#### 部署成功

![image-20260409170152687](https://cdn.218501.xyz/2026/04/a16a00005781787b86e24a99ec41aba9.png)

#### 打开CF提供的域名

![image-20260409170202180](https://cdn.218501.xyz/2026/04/6537b95748d59f9b346eb51347782b65.png)

#### 博客展示

![image-20260409170219400](https://cdn.218501.xyz/2026/04/52b47bd0202256a378a2fa496e419001.png)

#### 自定义域名【可选】

> 前提：Cloud Flare有托管的域名

1. 输入域名

   ![image-20260409170225194](https://cdn.218501.xyz/2026/04/ac9d152cc425fc1af44ff880d0fe4bb3.png)

2. 配置DNS

   ![image-20260409164849891](https://cdn.218501.xyz/2026/04/ac9d152cc425fc1af44ff880d0fe4bb3.png)

3. 配置成功

   打开自定义域名即可访问
   ![image-20260409170244326](https://cdn.218501.xyz/2026/04/204b91a61d5ab6ac07117e15e6b269be.png)

