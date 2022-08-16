import {} from "dotenv/config";
import axios from "axios";
import fs from "fs";
import debug from "debug";
import keypress from "keypress";
import chalk from "chalk";
import { parse } from "node-html-parser";

const log = debug("parser");

const topicsClassname = ".tm-article-snippet__title.tm-article-snippet__title_h2";
const usernameClassname = ".tm-user-info__username";
const votesClassname = ".tm-votes-meter__value.tm-votes-meter__value.tm-votes-meter__value_appearance-article.tm-votes-meter__value_rating";
const viewsClassname = ".tm-icon-counter__value";
const commentsClassname = ".tm-article-comments-counter-link__value";

const baseUrl = "https://habr.com";
const parsedDataFIlename = process.env.PARSED_DATA_FILENAME ||"parsed.json";
let selectedItem = 0;
let articles = [];

keypress(process.stdin);

process.stdin.on('keypress', function (ch, key) {
    log('got "keypress"', key);
    if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
    }

    if(key.name == 'up'){
        selectedItem == 0 ? selectedItem = articles.length - 1 : selectedItem -= 1;
        renderArticles();
    }
    if(key.name == 'down'){
        selectedItem == articles.length - 1 ? selectedItem = 0 : selectedItem += 1;
        renderArticles();
    }
});
   
process.stdin.setRawMode(true);
process.stdin.resume();

function renderArticles(){
    console.clear();
    articles.forEach((article, i) => {
        if(selectedItem == i){
            console.log(`>${article.author}: ${article.title}`);
            console.log(`\tViews: ${article.views}. Votes: ${article.votes}. Comments: ${article.comments}`);
            return;
        }
        console.log(chalk.gray(`${article.author}: ${article.title}`));
    });
    log('Selected item: %i', selectedItem);
}

async function main(){
    log("Парсинг Habrahabr...");
    let html = await axios.get(baseUrl + "/ru/all");
    html = parse(html.data);
    let articleSnippets = html.querySelectorAll(topicsClassname);
    let authorNames = html.querySelectorAll(usernameClassname);
    let votes = html.querySelectorAll(votesClassname);
    let views = html.querySelectorAll(viewsClassname);
    let comments = html.querySelectorAll(commentsClassname);

    for(let i = 0; i < articleSnippets.length; i++){
        let title = articleSnippets[i].querySelector("span").innerText;
        let url = baseUrl + articleSnippets[i].querySelector("a").getAttribute("href");
        let author = authorNames[i].innerText;
        author = author.replace('\n', '').trim();
        let _votes = parseInt(votes[i].innerText);
        let _views = parseInt(views[i].innerText);
        let _comments = comments[i].innerText;
        _comments = parseInt(_comments.replace('\n', '').trim());

        articles.push({ title, url, author, views : _views, votes : _votes, comments : _comments });
    }
    
    log("Habrahabr пропаршен!");

    renderArticles();

    log(`Записываю данные в ${parsedDataFIlename}`);
    fs.writeFileSync(parsedDataFIlename, JSON.stringify(articles, null, '\t'), 'utf8');
    log(`Данные записаны в файл ${parsedDataFIlename}`);
}

main();