import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { router as login } from "./api/login";
import { router as img } from "./api/img";
import { router as vote } from "./api/vote";
import { router as top10 } from "./api/top10";
import { router as profile } from "./api/profile";

export const app = express();
export const router = express();

app.use(
    cors({
        origin:"*",
    })
)
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use("/login",login);
app.use("/img", img);
app.use("/vote", vote);
app.use("/top10", top10);
app.use("/profile",profile);
