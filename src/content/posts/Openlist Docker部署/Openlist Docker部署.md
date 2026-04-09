
---

title: Openlist Docker部署
published: 2026-04-10
updated: 2026-04-10
description: '搭建Openlist服务，实现网盘聚合'
image: './Openlist Docker部署.webp'
tags: [blog,deploying,docker]
category: 'Experience'
draft: false

---

# Openlist Docker部署

[toc]

## Docker安装

### 方法一：宝塔面板

#### 搜索并安装

打开宝塔面板，点击Docker ，选择应用商店，搜索`openlist`，点击安装

![image-20260410134858869](https://cdn.218501.xyz/2026/04/232ab9c064c60ea36130cc92f22f9b7d.png)

#### 安装配置

自定义名称，选择自己的域名，其他默认即可

![image-20260410134929893](https://cdn.218501.xyz/2026/04/95fab73f422714c27cd6cb2feb62d621.png)

### 方法二：命令行安装

> 官方文档：[使用 Docker - OpenList 文档](https://doc.oplist.org.cn/guide/installation/docker)

当前用户运行和管理的版本：

```bash
mkdir -p /etc/openlist
docker run --user $(id -u):$(id -g) -d --restart=unless-stopped -v /etc/openlist:/opt/openlist/data -p 5244:5244 -e UMASK=022 --name="openlist" openlistteam/openlist:latest
```

容器内置的默认 `openlist` 用户运行和管理的版本：

```bash
sudo chown -R 1001:1001 /etc/openlist
docker run -d --restart=unless-stopped -v /etc/openlist:/opt/openlist/data -p 5244:5244 -e UMASK=022 --name="openlist" openlistteam/openlist:latest
```

## 网站上线

### 初始密码

依次点击：容器、对应的容器名、容器日志

即可查看登录密码

![image-20260410134943133](https://cdn.218501.xyz/2026/04/8bf4a59845572ea24e8966d00d050964.png)

### 网站配置

#### 解析DNS

笔者为阿里云的解析：依次填写`A记录`，`主机记录`、`记录值`等内容

![image-20260410134950396](https://cdn.218501.xyz/2026/04/9b8c52717710dccc84a60f11efe6640b.png)

#### 创建网站

注意要和2.2.1的网址相同

![image-20260410134956364](https://cdn.218501.xyz/2026/04/225cd7e71d1dafeb39bea4fc4f0dbc62.png)

#### 反向代理

- 宝塔面板依次点击：`网站`，`上一步创建的网站`，`反向代理`，`添加代理`
- 依次填写：`名称`，`目标url`为`http://127.0.0.1:端口号`、`发送域名`为`$host`
- 确认！

![image-20260412110035317](https://cdn.218501.xyz/2026/04/204c5b0109c5d71d5f6eb1267272cdd1.png)

#### 添加SSL证书

1. 选择`SSL`、`免费证书`、`申请证书`、`选择域名`、`申请证书`
   ![image-20260410135043385](https://cdn.218501.xyz/2026/04/fb6daad0eebe77d3cbd049bf3f65274e.png)
2. 保存证书、开启`强制HTTPS`
   ![image-20260410135053747](https://cdn.218501.xyz/2026/04/4d7968ec5318e68433564fe8ec7c4226.png)

### 访问网站

访问对应的域名【见2.2.1DNS记录的网址】

- 默认登录账号为`admin`
- 默认密码【见2.1初始密码】

![image-20260410135103617](https://cdn.218501.xyz/2026/04/eb15b00ec21e104f7e2b0fa81424b39e.png)

记得及时更改用户名和重置密码！！！

![image-20260410110516718](https://cdn.218501.xyz/2026/04/a727355871fad7fe097be4e15db3d367.png)

## 网址美化

见Github项目，感谢大佬的制作：[SajunaOo/OpenList-Moe: ✨ 一个 OpenList 美化项目，🐒 猴子打字机原理的产物。](https://github.com/SajunaOo/OpenList-Moe)

![image-20260410135136014](https://cdn.218501.xyz/2026/04/11ec6c19ffe2e705338b6f58b14fed30.png)

## 添加存储

[通用项 - OpenList 文档](https://doc.oplist.org.cn/guide/drivers/common)

网盘及存储点评：

- 中国移动网盘【不限速，移动号码送白银会员，4TB超大空间】
- 电信天翼云网盘【不限速，空间30GB，但咸鱼有卖2T永久空间的】
- 蓝奏云【不限速，不限空间，但文件最大100MB】
- OneDrive【不限速，但国际版国内访问速度慢，普通账户空间有限】
- 百度网盘【超级会员还需要修改UA才能播放视频和查看PDF，但可获取直链下载，配合motrix下载快】
- CloudFlare R2【需要银行卡注册才能使用，适合做图床，**10GB** 免费存储空间和全球免流量费，限制是：每月 100 万次 A 类操作和 1000 万次 B 类操作】
- WPS【办公方便，但是非会员存储有限】
