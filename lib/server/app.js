import bodyParser from "body-parser";  //用来解析http请求体,是express默认使用的中间件之一
import cookieParser from "cookie-parser";  //这个插件通常当作中间件使用，app.use(cookieParser()), 这样就可以处理每一个请求的cookie
import cors from "cors";    //通过后端参与处理跨域,同时前端只要发送正常的Ajax请求即可.这样的技术叫做CORS：Cross-Origin Resource Sharing跨域资源共享
import express from "express";

const app = express();
// Middlewares
app.use(cors());
app.options('*', cors());   //??
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Routers
app.use(express.static("public"));

export default app;