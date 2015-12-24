//importing fs moulde
var fs = require('fs');

//data structure for plotting
var arrGdpGni=[];
var arrGdpPerGniPer=[];
var countryContinent=[];
var allContinents=[];
var country;
var gdp;
var gni;
var gdpPer;
var gniPer;

function gdpIND (year, gdp) {
  this.year=year;
  this.gdp=gdp;
};

function gdpGni (country, gdp, gni) {
  this.country=country;
  this.gdp=gdp;
  this.gni=gni;
};

function gdpPerGniPer (country, gdpPer, gniPer) {
  this.country=country;
  this.gdpPer=gdpPer;
  this.gniPer=gniPer;
};

function countryCont (country, continent) {
  this.country=country;
  this.continent=continent;
};

function continentGDPPer(year,africa,asia,europe,northAmerica,oceania,southAmerica)
{
  this.year=year;
  this.africa=africa;
  this.asia=asia;
  this.europe=europe;
  this.northAmerica=northAmerica;
  this.oceania=oceania;
  this.southAmerica=southAmerica;
};

function perContinent(year,gdpPer)
{
  this.year=year;
  this.gdpPer=gdpPer;
};

var africa=[];
var asia=[];
var europe=[];
var northAmerica=[];
var oceania=[];
var southAmerica=[];

var as=0;
var af=0;
var eu=0;
var oc=0;
var sa=0;
var na=0;

var contents = fs.readFileSync('../data/continents.csv', 'utf8');
var lines = (contents).split('\n');
for (var i = 0; i < lines.length; ++i)
{
  var row=lines[i].split(',');
  if(row.length===2)
  {
    countryContinent.push(new countryCont(row[1].trim(),row[0].trim()));
  }
}

var buffer = '';
var rs = fs.createReadStream('../data/WDI_Data.csv');
rs.on('data', function(chunk) {
  var lines = (buffer + chunk).split('\n');
  buffer = lines.pop();
  for (var i = 0; i < lines.length; ++i) {
    processTheFile(lines[i]);
  }
});

rs.on('end', function() {
  if(buffer)
  {
    processTheFile(buffer);
  }
  addAllContinents();
  createJson(arrGdpGni,arrGdpPerGniPer);
});

rs.on('error',function(){
  console.log("error reading the file");
});

//Process the file line after line
function processTheFile(line){
  var row=line.split(',');

  if(row[2]=="GDP at market prices (constant 2005 US$)" && notTheRegions(row[0])) {
    country=row[0];
    gdp=parseInt(Number(row[49]));
    gni=null;
  }

  if(row[2]=="GNI (constant 2005 US$)" && country)
  {
    gni=parseInt(Number(row[49]));
    if(gdp && gni)
    {
      if(arrGdpGni.length<15)
      {
        arrGdpGni.push(new gdpGni(country, gdp, gni));
        if(arrGdpGni.length==15)
        {
          arrGdpGni.sort(function(a,b){
            if(a.gdp<b.gdp){
              return 1;
            }
            else{
              return -1;
            }
          });
        }
      }
      else {
        if(arrGdpGni[arrGdpGni.length-1].gdp<gdp)
        {
          arrGdpGni[arrGdpGni.length-1]=new gdpGni(country, gdp, gni);
          arrGdpGni.sort(function(a,b){
            if(a.gdp<b.gdp){
              return 1;
            }
            else{
              return -1;
            }
          });
        }
      }
      gdp=null;
      gni=null;
    }
  }

  if(row[2]=="GDP per capita (constant 2005 US$)" && country)
  {
    aggregateContinentSum(row,country);
    gdpPer=parseInt(Number(row[49]));
    gniPer=null;
  }

  if(row[2]=="GNI per capita (constant 2005 US$)")
  {
    gniPer=parseInt(Number(row[49]));
    if(gdpPer && gniPer)
    {
      if(arrGdpPerGniPer.length<15)
      {
        arrGdpPerGniPer.push(new gdpPerGniPer(country, gdpPer, gniPer));
        if(arrGdpPerGniPer.length==15)
        {
          arrGdpPerGniPer.sort(function(a,b){
            if(a.gdpPer<b.gdpPer){
              return 1;
            }
            else{
              return -1;
            }
          });
        }
      }
      else {
        if(arrGdpPerGniPer[arrGdpPerGniPer.length-1].gdpPer<gdpPer)
        {
          arrGdpPerGniPer[arrGdpPerGniPer.length-1]=new gdpPerGniPer(country, gdpPer, gniPer);
          arrGdpPerGniPer.sort(function(a,b){
            if(a.gdpPer<b.gdpPer){
              return 1;
            }
            else{
              return -1;
            }
          });
        }
      }
      gdpPer=null;
      gniPer=null;
      country=null;
    }
  }

  //Creating file for GDP growth of India
  var flag=true;
  if(flag && row[0]==="India" && row[2]=="GDP growth (annual %)")
  {
    flag=false;
    var gdpIndArr = [];
    for(var i=4,year=1960;i<60;i++,year++)
    {
      if(row[i])
      {
        gdpIndArr.push(new gdpIND(year,parseFloat(row[i])));
      }
    }
    var gdpINDJson = JSON.stringify(gdpIndArr, null, 4);
    fs.writeFile( "../data/gdpIND.json", gdpINDJson, function(err) {
      if(err) {
        return console.log(err+" :error writing to JSON file");
      }
    });
  }
}

//Writing JSON  to external file
function createJson(arrGdpGni,arrGdpPerGniPer) {
  var gdpGniJson = JSON.stringify(arrGdpGni, null, 4);
  fs.writeFile( "../data/gdpGni.json", gdpGniJson, function(err) {
    if(err) {
      return console.log(err+" :error writing to JSON file");
    }
  });

  var gdpPerGniPerJson = JSON.stringify(arrGdpPerGniPer, null, 4);
  fs.writeFile( "../data/gdpPerGniPer.json", gdpPerGniPerJson, function(err) {
    if(err) {
      return console.log(err+" :error writing to JSON file");
    }
  });

  var gdpPerContJson = JSON.stringify(allContinents, null, 4);
  fs.writeFile( "../data/gdpPerContJson.json", gdpPerContJson, function(err) {
    if(err) {
      return console.log(err+" :error writing to JSON file");
    }
  });
}

function aggregateContinentSum(row,country)
{
  var continent=getContinent(country);
  if(continent==="Africa")
  {
    af++;
    for(var i=4,j=0,year=1960;i<60;i++,year++,j++)
    {
      if(africa[j]&&row[i])
      {
        africa[j].gdpPer+=parseInt(Number(row[i]));
      }
      else {
        africa.push(new perContinent(year,parseInt(Number(row[i]))));
      }
    }
  }
  else if(continent==="Asia")
  {
    as++;
    for(var i=4,j=0,year=1960;i<60;i++,year++,j++)
    {
      if(asia[j]&&row[i])
      {
        asia[j].gdpPer+=parseInt(Number(row[i]));
      }
      else {
        asia.push(new perContinent(year,parseInt(Number(row[i]))));
      }
    }
  }
  else if(continent==="Europe")
  {
    eu++;
    for(var i=4,j=0,year=1960;i<60;i++,year++,j++)
    {
      if(europe[j]&&row[i])
      {
        europe[j].gdpPer+=parseInt(Number(row[i]));
      }
      else {
        europe.push(new perContinent(year,parseInt(Number(row[i]))));
      }
    }
  }
  else if(continent==="North America")
  {
    na++;
    for(var i=4,j=0,year=1960;i<60;i++,year++,j++)
    {
      if(northAmerica[j]&&row[i])
      {
        northAmerica[j].gdpPer+=parseInt(Number(row[i]));
      }
      else {
        northAmerica.push(new perContinent(year,parseInt(Number(row[i]))));
      }
    }
  }
  else if(continent==="Oceania")
  {
    oc++;
    for(var i=4,j=0,year=1960;i<60;i++,year++,j++)
    {
      if(oceania[j]&&row[i])
      {
        oceania[j].gdpPer+=parseInt(Number(row[i]));
      }
      else {
        oceania.push(new perContinent(year,parseInt(Number(row[i]))));
      }
    }
  }
  else if(continent==="South America")
  {
    sa++;
    for(var i=4,j=0,year=1960;i<60;i++,year++,j++)
    {
      if(southAmerica[j]&&row[i])
      {
        southAmerica[j].gdpPer+=parseInt(Number(row[i]));
      }
      else {
        southAmerica.push(new perContinent(year,parseInt(Number(row[i]))));
      }
    }
  }
}

function addAllContinents()
{
  for(var i=4,j=0;i<60;i++,j++)
  {
    if(africa[j]&&asia[j]&&europe[j]&&northAmerica[j]&&oceania[j]&&southAmerica[j])
    {
      allContinents.push(new continentGDPPer(asia[j].year,africa[j].gdpPer/af,asia[j].gdpPer/as,europe[j].gdpPer/eu,northAmerica[j].gdpPer/na,oceania[j].gdpPer/oc,southAmerica[j].gdpPer/sa    ));
    }
  }
}

function getContinent(country)
{
  for(var i=0;i<countryContinent.length;i++)
  {
    if(countryContinent[i].country && country.toUpperCase() === countryContinent[i].country.toUpperCase())
    {
      return countryContinent[i].continent;
    }
  }
}

//Filtering out regions and groups
function notTheRegions(country){
  return country!="World" &&country!= "High income" && country!= "OECD members" &&
  country!="High income: OECD"&&country!= "Europe & Central Asia (all income levels)" &&
  country!="European Union" &&country!="North America"&&country!= "Euro area" &&
  country!="East Asia & Pacific (all income levels)"&&country!= "Low & middle income"&&
  country!= "Middle income" &&country!="Upper middle income"&&country!="Latin America & Caribbean (all income levels)"&&
  country!="High income: nonOECD" && country!="East Asia & Pacific (developing only)"&&
  country!="Latin America & Caribbean (developing only)"&&country!="Lower middle income"&&country!="South Asia"&&
  country!="Europe & Central Asia (developing only)"&&country!="Middle East & North Africa (all income levels)"&&
  country!="Arab World"&&country!="Central Europe and the Baltics"&&country!="Middle East & North Africa (developing only)"&&
  country!="Sub-Saharan Africa (all income levels)";
}
