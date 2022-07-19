/*
 * @Author: linfei6
 * @Date: 2022-07-19 14:37:17
 * @LastEditors: linfei6
 * @LastEditTime: 2022-07-19 16:23:23
 */
const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const path = require("path");
const proxy = require('koa-server-http-proxy')
const { init: initDB, Counter } = require("./db");

const router = new Router();

// 首页
const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
router.get("/", async(ctx) => {
  ctx.body = homePage;
});

// 更新计数
router.post("/api/count", async(ctx) => {
  const { request } = ctx;
  const { action } = request.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  ctx.body = {
    code: 0,
    data: await Counter.count(),
  };
});

// 获取计数
router.get("/api/count", async(ctx) => {
  const result = await Counter.count();
  ctx.body = {
    code: 0,
    data: result,
  };
});

// 小程序调用，获取微信 Open ID
router.get("/api/wx_openid", async(ctx) => {
  if (ctx.request.headers["x-wx-source"]) {
    ctx.body = ctx.request.headers["x-wx-openid"];
  }
});

const app = new Koa();
app
  .use(logger())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.use(proxy('/page', {
  target: 'https://7072-prod-9gu6ius49f74f9cf-1255449337.tcb.qcloud.la',
  pathRewrite: {
    '^/page': '/'
  }
}));

const port = process.env.PORT || 80;
async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}
bootstrap();
