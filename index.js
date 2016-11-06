var data=require("./data");
var displaySchema=require("./display_schema");
var showValues=require("./showValues");
var scrollToAnchor=require("./scroll");
var tabs=require("./tabs");
var versionsLinks=require("./versionLinks");

versionsLinks();
tabs(data.active,data.enums,data.enumsValues);
displaySchema(data.enums).then(scrollToAnchor);
showValues(data.version);