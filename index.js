var async = require("async");
var fs = require('fs');
var request = require('request');
const uuidv4 = require('uuid/v4');
const { URL } = require('url');
 
var data = {};
var urls = [];

var getUrlsArray = function(){
  let urlsFile = './urls.json';
  
  if(process.argv[2]!=undefined){
    urlsFile = process.argv[2];
  }
  if (!fs.existsSync(urlsFile)) {
    console.error(urlsFile+' could not be found!');
    process.exit(1);
  }
  
  let rawdata = fs.readFileSync(urlsFile);
  let urlsData = JSON.parse(rawdata);
  
  var m = 1;
  if(process.argv[3]!=undefined && parseInt(process.argv[3])>0){
    m = parseInt(process.argv[3]);
  } 
  var urls_ = [];
  for(var i=0;i<m;i++){
    urls_ = urls_.concat(urlsData);
  }
  return urls_;
};


var startTest = async function(){
  urls = getUrlsArray();

  async.forEachOf(urls, (value, key, callback) => {
    var uuid = uuidv4();
    data[uuid]={
      url:value,
      isDone:false,
      startedAt:(new Date).getTime(),
      finishedAt:null,
      duration:-1,
      uuid:uuid
    }
    request.get(value, function(err, res, body){
      if (err) return callback(err);
      data[uuid].finishedAt = (new Date).getTime();
      data[uuid].contentType = res.headers['content-type'];
      data[uuid].contentLength = res.headers['content-length'];
      data[uuid].isDone = true;
      data[uuid].duration = ((data[uuid].finishedAt-data[uuid].startedAt)/1000).toFixed(2);
    });
  }, err => {
      if (err) console.log(err.message);
  });
  justWait();
};


var startedAt = (new Date).getTime();
var lastT = -1;

//wait until all urls downloaded
var justWait = function(){
  var t = 0;
  for(var i in data){
    if(data[i].isDone){
      t++;
    }
  }
  var totalTime = (((new Date).getTime()-startedAt)/1000);
  if(t<urls.length){
    if(lastT!=t){
      lastT = t;
      console.log(t,"of",urls.length);
    }
    setTimeout(justWait, 10);
  }else{
    console.log("------ SUMMARY -------");
    console.log("host","protocol","path","duration");
    for(var i in data){
      var url = new URL(data[i].url);
      console.log(url.host,url.protocol,url.pathname,data[i].duration);
    }
    console.log("total duration",(((new Date).getTime()-startedAt)/1000).toFixed(3));
  }
};
startTest();