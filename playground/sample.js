//console.log("2012-01-01T23:00:00.000Z" < new Date(new Date().getTime()));
var nowDate = new Date(new Date().getTime());
var startDate = new Date("2012-01-01T23:00:00.000Z");
var endDate = new Date("2012-02-03T23:00:00.000Z");
//console.log(startDate<nowDate);

if((endDate < nowDate)||((endDate > nowDate)&&(startDate < nowDate))){
    console.log("You can't edit finished/continuing event");
}