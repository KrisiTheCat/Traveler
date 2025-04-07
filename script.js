$(document).ready(function(){
    const apiKey = API_KEY_GOOGLE; 

    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: apiKey,
        v: "weekly",
      });

    scrollTo({
        top:0,
        behavior: "smooth"
    })

    
    // send request to openexchangerates -> all available currencies with names
    var allCurrencies = [];
    $.ajax({
        type: "GET",
        url: "https://openexchangerates.org/api/currencies.json",
        dataType: "json",
        success: function(data) {
            allCurrencies = data;
        }
    });

    // send request to openexchangerates -> all available currencies with current exchange rate
    var currExchange = [];
    $.ajax({
        type: "GET",
        url: "https://openexchangerates.org/api/latest.json",
        data: { 
            app_id: API_KEY_OPENEXCHANGE
        },
        dataType: "json",
        success: function(data) {
            currExchange = data.rates;
        }
    });
   
    document.getElementById('destination').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchDestination();
        }
    });
    $('#searchCityBtn').on('click', ()=>{searchDestination();});
    async function searchDestination() {
        let city = document.getElementById("destination").value;
        let result = document.getElementById("result");
        $('#cityInfo').show();
        scrollTo({
            top:$('#cityInfo').offset().top,
            behavior: "smooth"
        })

        if (!city) {
            result.innerHTML = "Please enter a city.";
            return;
        }
        // send request to google geocoding PAI -> overall info
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${apiKey}&language=en`;

        try {
            let response = await fetch(url);
            let data = await response.json();


            if (data.status == 'OK') {
                console.log(data);

                let lat = data.results[0].geometry.location.lat;
                $('#latLbl').html(lat);
                let lng = data.results[0].geometry.location.lng;
                $('#lngLbl').html(lng);
                let countryCode;
                $('#cityDescription').html(data.results[0].formatted_address);

                let address_components = data.results[0].address_components;
                for(section of address_components){
                    if(section.types.includes('locality')){ // city name
                        $('#cityName').html(section.long_name);
                    }
                    if(section.types.includes('country')){ // city name
                        $('#countryLbl').html(section.long_name);
                        countryCode = section.short_name;
                        $('#countryCodeLbl').html(section.short_name);
                    }
                }
    

                const { Map } = await google.maps.importLibrary("maps");
                map = new Map(document.getElementById("mapDiv"), {
                    center: { lat: lat, lng: lng },
                    zoom: 8,
                });

                var currency = currencies[countryCode];
                console.log(allCurrencies);
                console.log(currency);
                $('#currencyLbl').html(allCurrencies[currency]);
                $('#currencyCodeLbl').html(currency);
                $('#exchangeLbl').html(`1 USD = ${currExchange[currency]} ` + currency);

                //api request for weather
                
                urlWeather = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;
                let response = await fetch(urlWeather);
                let data2 = await response.json();
                console.log(data2);

                $('#weatherIcon').attr('src',data2.weatherCondition.iconBaseUri+'.png');
                $('#weatherTemp').html(data2.temperature.degrees);
                $('#weatherDescription').html(data2.weatherCondition.description.text);
                $('#weatherFeels').html(data2.feelsLikeTemperature.degrees);
                $('#weatherHumidity').html(data2.relativeHumidity);
                $('#windSpeed').html(data2.wind.speed.value);
                $('#windDir').html(capitalizeFirstLetter(data2.wind.direction.cardinal));

                urlForecast = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;
                let response2 = await fetch(urlForecast);
                let data3 = await response2.json();
                console.log(data3);

                let html = '<div style="visibility: hidden;">a</div>';
                for(day of data3.forecastDays){
                    console.log(day.feelsLikeMaxTemperature.degrees);
                    console.log(day.daytimeForecast.weatherCondition.iconBaseUri);
                    html += `<div class="forecast-day forecast-day-selected">
                                            <div class="day-name">${formatDateToText(day.interval.startTime)}</div>
                                            <div class="day-icon"><img src="${day.daytimeForecast.weatherCondition.iconBaseUri}.png"/></div>
                                            <div class="day-details">
                                                <span class="high">${day.feelsLikeMaxTemperature.degrees}°</span>
                                                <span class="low">${day.feelsLikeMinTemperature.degrees}°</span>
                                            </div>
                                        </div>`;
                }
                html += '<div style="visibility: hidden;">a</div>';
                $('#forecastDiv').html(html);

                // $.ajax({
                //     type: "GET",
                //     url: "https://maps.googleapis.com/maps/api/place/details",
                //     data: { 
                //         app_id: '72863d2b9c854222af830acf4b13a10f'
                //     },
                //     dataType: "json",
                //     success: function(xml) {
                //             console.log(xml)
                //         }
                // });
                // var urlPhotos = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${data.results[0].place_id}&key=${apiKey}`;
                // let response3 = await fetch(urlPhotos);
                // let data3 = await response3.json();
                // console.log(data3);
            } else {
                result.innerHTML = "City not found. Try another one!";
                
                $('#cityInfo').hide();
                scrollTo({
                    top:0,
                    behavior: "smooth"
                })
            }
        } catch (error) {
        console.log(error);
            result.innerHTML = "Error fetching data. Please try again.";
        }
}

    $('#carouselPrev').on('click', ()=>{moveCarousel(-1)});
    $('#carouselNext').on('click', ()=>{moveCarousel(1)});
});

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1).toLowerCase();
}


var currShowing = 0;
const daysForecast = 10;
function moveCarousel(direction) {
    const scroller = document.querySelector('.forecast-days');

    currShowing+=direction;
    if(currShowing < 0) currShowing += daysForecast;
    if(currShowing >= daysForecast) currShowing -= daysForecast;
    console.log('here', scroller);
    $(".forecast-day-selected").removeClass('forecast-day-selected');
    let element = $('.forecast-day').get(currShowing);
    console.log('here', element);
    $(element).addClass('forecast-day-selected');
    element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    // scroller.scrollTo(element);
    // scroller.scrollTo({
    //     top:$($('.forecast-day').get(currShowing)),
    //     behavior: "smooth"
    // })
    // scroller.scrollTo({
    //     left: direction * scrollAmount,
    //     behavior: 'smooth'
    // });
}


function formatDateToText(timestamp) {
    const date = new Date(timestamp);
  
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
  
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
  
    // Function to add ordinal suffix
    function getOrdinal(n) {
      if (n >= 11 && n <= 13) return n + "th";
      switch (n % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
      }
    }
  
    return `${month} ${getOrdinal(day)}`;
  }
  
  // Example usage:
  console.log(formatDateToText("2025-04-07T04:00:00Z")); // "April 7th"
  