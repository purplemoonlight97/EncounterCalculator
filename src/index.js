import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ReactDOM from 'react-dom/client';

//takes a number and returns the species name of a pokemon
const findName = (num, arr) => {
  let name = "missingno."
  for (const e of arr){
    if (e.number === num){
      name = e;
      break;
    }
  };
  return name;//name.charAt(0).toUpperCase() + name.slice(1);
};

//converts an array of encounters into HTML for output
const encounterHTMLGenerator = (arr, str, pokemonArr, bool, modelStr) => {
  let tempHTML = ``;
  arr.forEach(e => {
    const pokemon = findName(e.number, pokemonArr);
    tempHTML += `
      <div class="encounterSlot">
        <p>
          <span class="pokemonName fullLength"><b>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</b></span>
        </p>
        <img class="${pokemon.type1 ? pokemon.type1 : pokemon.type1}" src="${'./resources/' + (modelStr === "sprites" ? str : modelStr) + '/' + (((str.includes("gen1") && modelStr === "sprites") || !bool) ? "" : "shiny/") + e.number + '.png'}" alt="Pokemon sprite for ${pokemon.name}"/>
        <span>Rate: </span><span class="secondaryInfo">${Math.round(e.rate * 10000)/100}%</span>
        <span>Level: </span><span class="secondaryInfo">${e.minLevel}${('maxLevel' in e) ? "-" + e.maxLevel : ""}</span>
      </div>
    `;
  });
  return {__html: tempHTML};
};

//switch between the shiny and not shiny sprite
const shinyFlip = (event) => {
  let str = event.target.src.toString();
  let index = str.length - 1;
  //find the last / in the src
  for (let i = index; i >= 0; i--){
    if (str.charAt(i) === "/"){
      index = i;
      break;
    }
  }
  if(str.includes("shiny")){
    const indexLeft = index - 6;
    const src = str.slice(0,indexLeft) + str.slice(index, str.length);
    event.target.src = src;
  } else {
    const src = str.slice(0, index) + "/shiny/" + str.slice(index + 1, str.length);
    event.target.src = src;
  }
}

//converts an array of processed (repels, abilities, etc.) into HTML for output
const processedEncountersHTMLGenerator = (arr, str, pokemonArr, genSpread, bool, modelStr) => {
  let tempHTML = ``;
  let encounterRate = 0;
  arr.forEach(e => {
    encounterRate += Number(e.rate);
  });
  let modifier = 100/encounterRate;
  //get male percentage
  let malePercent = ["err"];
  let cuteCharmPercent = 0;
  switch (genSpread){
    case 2:
      malePercent = [1,0.875,0.75,"",0.5,"",0.25,"",0];
      break;
    case 3:
    case 4: 
      malePercent = [1,0.8789,0.7539,"",0.5039,"",0.2539,0.1211,0];
      cuteCharmPercent = 0.667;
      break;
    case 5: 
      malePercent = [1,0.8789,0.7539,"",0.5039,"",0.2539,0.1211,0];
      cuteCharmPercent = 0.67;
      break;
    case 6:
    case 7:
      malePercent = [1,0.8810,0.7540,"",0.5,"",0.2460,0.1111,0];
      cuteCharmPercent = 0.667;
      break;
    case 8: 
      malePercent = [1,0.8814,0.7550,"",0.5020,"",0.2490,0.1146,0];
      cuteCharmPercent = 0.66;
      break;
  }
  arr.forEach(e => {
    const pokemon = findName(e.number, pokemonArr);
    //calculate the gender split
    let male = 0;
    let female = 0;
    if (malePercent[0] != "err" && pokemon.gender){ //gender to deal with
      if (pokemon.gender === 0 || pokemon.gender === 8){ //all one gender pokemon
        male = malePercent[8-pokemon.gender];
        female = 1 - male;
      } else if (e.genderBias === "female"){ //male cute charm bias
        male = cuteCharmPercent + ((1-cuteCharmPercent) * malePercent[8-pokemon.gender]);
        female = 1 - male;
      } else if (e.genderBias === "male"){ //female cute charm bias
        male = (1-cuteCharmPercent) * malePercent[8-pokemon.gender];
        female = 1 - male;
      } else { //not a single gender pokemon and no cute charm
        male = malePercent[8-pokemon.gender];
        female = 1 - male;
      }
    }
    const finalRate = e.rate * modifier * 100;
    //${pokemon.type1}
    tempHTML += `
      <div class="encounterSlot ${Math.floor(Math.random() * 1000) === 0 ? "ellipse" : ""}"> 
        <p>
          <span class="pokemonName"><b>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</b></span>
          <span calss="pokemonRate"><b>${Math.round(finalRate)/100}%</b></span>
        </p>
        <img 
          class="${
            (str.includes("gen1") && modelStr === "sprites") ? 
            "" :
            "shinyFlip"
          } ${
            pokemon.type1 ? 
            pokemon.type1 : 
            pokemon.type1
          } ${
            Math.floor(Math.random() * 100) === 0 ? 
            "ellipse" : 
            ""
          }" 
          src="${
            './resources/' + 
            (modelStr === "sprites" ?
               str : 
               modelStr
              ) +
              '/' + 
              (((str.includes("gen1") && modelStr === "sprites") || !bool) ? 
              "" : 
              "shiny/") + 
              e.number + 
              '.png'
            }" 
          alt="Pokemon sprite for ${pokemon.name}"
        />
        ${(male !== 0) ? `<span class="genderHeader">Male: </span><span class="genderPercent">${Math.round(male * finalRate)/100}% (${Math.round(male * 10000)/100}%)</span>` : ``}
        ${(female !== 0) ? `<span class="genderHeader">Female: </span><span class="genderPercent">${Math.round(female * finalRate)/100}% (${Math.round(female * 10000)/100}%)</span>` : ``}
        ${(male === 0) && (female === 0) ? `<span class="genderHeader">Gender: </span><span class="genderPercent">Unknown</span>` : ``}
      </div>
    `;
  });
  tempHTML += `<div class="encounterRate">
                <div class="barChart" style="width: ${arr.length === 200 ? "" : Math.round(encounterRate * 10000)/100 + '%'}">
                  <span>${arr.length === 200 ? "" : Math.round(encounterRate * 10000)/100 + '%'} Encounter Rate</span>
                </div>
              </div>
              <div class="encounterRateNoBar">
                <span>${arr.length === 200 ? "" : Math.round(encounterRate * 10000)/100 + '%'} Encounter Rate</span>
              </div>`
  return {__html: tempHTML};
};

//takes an array of encounters and combines slots of the same species (number)
const condenseEncounters = (arr) => {
  const smooshedArr = [];
  arr.forEach(e => {
    let match = false;
    smooshedArr.forEach(j => {
      if (j.number === e.number){
        match = true;
        j.rate += Number(e.rate);
      }
    });
    if (!match){
      smooshedArr.push({"number": e.number, "rate": Number(e.rate), "genderBias": e.genderBias});
    }
  });
  smooshedArr.sort((a,b) => b.rate - a.rate);
  return smooshedArr;
};

//input of repels
const RepelSection = (props) => {

  const [repelLevel, setRepelLevel] = useState();

  //takes an array of encounters and repels out lower levels
  const processRepels = (arr, num, bool) => {
    const tempArray = [];
    arr.forEach(e => {
      const minLevel = Number(e.minLevel);
      const maxLevel = Number(e.maxLevel);
      if (minLevel >= num){
        tempArray.push(e);
      } else if (maxLevel >= num && minLevel < num){
        const numLevels = (maxLevel - minLevel) + 1;
        const levelsRemoved = (num - minLevel);
        const newRate = (1 - (levelsRemoved / numLevels)) * e.rate;
        tempArray.push({"number": e.number, "minLevel": num, "maxLevel": maxLevel, "rate": newRate});
      }
    });
    return tempArray;
  };

  const handleChange = (event) => { 
    let holdRepelLevel = event.target.value;
    holdRepelLevel = holdRepelLevel.replace(/\D/g,"");
    holdRepelLevel = Number(holdRepelLevel).toString(); //Number to string gets rid of leading zeros
    if(holdRepelLevel > 100){
      holdRepelLevel = 100;
    } else if (holdRepelLevel <= 0){
      holdRepelLevel = "";
    } else if (holdRepelLevel.match(/\D/g)){
      holdRepelLevel = repelLevel;
    }
    setRepelLevel(holdRepelLevel);
    props.setEncounters(processRepels(props.encounters, holdRepelLevel)); 
  };

  //if the encounters that feeds into repels has changed, it needs to reset everything inside
  useEffect(() => {
    if (props.repel){
      props.setEncounters(processRepels(props.encounters, repelLevel));
    } else{
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);
  
  useEffect(() => {
    setRepelLevel("");
  }, [props.primeEncounters]);
  
  useEffect(() => {
    const repelInput = document.getElementById("repelLevelInput")
    if(repelInput){
      const exemptGames = ["emerald", "diamond", "pearl", "platinum", "heartgold", "soulsilver"/*, "black", "black2", "white", "white2"*/];
      if(!(exemptGames.includes(props.game))){ //exempt games can have intimidate and repel at the same time
        repelInput.disabled = props.intimidateActive;
      } else {
        repelInput.disabled = false;
      }
    }
  }, [props.intimidateActive]);

  useEffect(() => {
    const repelInput = document.getElementById("repelLevelInput");
    if (repelInput){
      repelInput.disabled = props.radarActive;
    };
  }, [props.radarActive]);

  if (props.repel){
    return(
      <div id="repelArea" class="modChunk">
        <label for="repelLevelInput">Repel Level:</label>
        <input 
          id="repelLevelInput" 
          type='number' 
          value={repelLevel} 
          onChange={handleChange} 
          onKeyDown={(evt) => !(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"].includes(evt.key)) && evt.preventDefault()}
        />
      </div>
    )
  }
}

//input of time of day
const TimeOfDaySection = (props) => {

  const processTod = (arr, newArr) => {
    if (newArr.length > 1){
      const tempArray = JSON.parse(JSON.stringify(arr));
      for (let i = 0; i < tempArray.length; i++){
        tempArray[i].number = newArr[i*2];
        tempArray[i].minLevel = newArr[i*2 + 1];
      }
      return tempArray;
    }
    return arr;
  };

  const handleChange = (event) => {
    const todIndex = event.target.value;
    const timeArray = props.tod.split("|");
    props.setEncounters(processTod(props.encounters, timeArray[todIndex].split(",")));
    props.setTodIndex(todIndex);
  };

  useEffect(() => {
    if (props.tod){
      const todIndex = 1;
      const timeArray = props.tod.split("|");
      props.setEncounters(processTod(props.encounters, timeArray[todIndex].split(",")));
      props.setTodIndex(todIndex);
    } else {
      props.setEncounters(props.encounters);
      props.setTodIndex(1);
    }
  }, [props.encounters]);

  if (props.tod){
    return (
      <div id="todArea" class="modChunk">
        <label for="todInput">Time of Day: </label>
        <div class="select select--enabled">
          <select id="todInput" onChange={handleChange}>
            <option value="0">Morning</option>
            <option value="1" selected>Day</option>
            <option value="2">Night</option>
          </select>
        </div>
      </div>
    );
  }
};

//input swarm in gold silver and crystal
const GscSwarmSection = (props) => {

  const processSwarm = (arr, newArr) => {
    if (newArr.length > 1){
      const tempArray = JSON.parse(JSON.stringify(arr));
      for (let i = 0; i < tempArray.length; i++){
        tempArray[i].number = newArr[i*2];
        tempArray[i].minLevel = newArr[i*2 + 1];
        if (tempArray[1].maxLevel){
          tempArray[i].maxLevel = newArr[i*2 + 1];
        }
      }
      return tempArray;
    }
    return arr;
  };

  const handleChange = () => {
    const checkbox = document.getElementById("gscSwarmBox");
    if (checkbox && checkbox.checked){
      const swarmArray = props.gscSwarm.split("|");
      props.setEncounters(processSwarm(props.encounters, swarmArray[props.todIndex].split(",")));
    } else {
      props.setEncounters(props.encounters);
    }
  };

  useEffect(() => {
    if (props.gscSwarm){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.gscSwarm){
    return (
      <div id="gscSwarmArea" class="modChunk">
        <label for="gscSwarmBox">Swarm?</label>
        <input type="checkbox" id="gscSwarmBox" onChange={handleChange}/>
      </div>
    )
  }
};

//input swarm in ruby sapphire and emerald
const RseSwarmSection = (props) => {

  const [rseSwarmHTML, setRseSwarmHTML] = useState("");

  const handleChange = () => {
    const dropdown = document.getElementById("rseSwarmSelect");
    if (dropdown && dropdown.value !== "none"){
      const tempArray = JSON.parse(JSON.stringify(props.encounters))
      tempArray.forEach((e) => {
        e.rate = e.rate * 0.5;
      });
      //we sent the value as NUM|NUM so we must split it to get the two numbers we need
      const tempValues = dropdown.value.split("|");
      tempArray.push({"number": tempValues[0], "minLevel": tempValues[1], "rate": "0.5"});
      props.setEncounters(tempArray);
    } else {
      props.setEncounters(props.encounters);
    }
  };

  //updates the HTML of the dropdown depending on the variable
  useEffect(() => {
    if (props.rseSwarm){
      let tempHTML = "<option value='none' selected>None</option>";
      const swarmsArray = Object.values(props.rseSwarm);
      swarmsArray.forEach((e) => {
        tempHTML += `<option value="${e.number + "|" + e.minLevel}">${e.swarmName}</option>`
      });
      setRseSwarmHTML(tempHTML);
    }
  }, [props.rseSwarm]);

  useEffect(() => {
    if (props.rseSwarm){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.rseSwarm){
    return (
      <div id="rseSwarmArea" class="modChunk">
        <label for="rseSwarmSelect">Swarm? </label>
        <div class="select select--enabled">
          <select id="rseSwarmSelect" onChange={handleChange} dangerouslySetInnerHTML={{__html: rseSwarmHTML}}>
          </select>
        </div>
      </div>
    )
  }
};

const GscRuinsSection = (props) => {

  const handleChange = () => {

    const URcheck = document.getElementById("upper-right");
    const LLcheck = document.getElementById("lower-left");
    const LRcheck = document.getElementById("lower-right");
    const ULcheck = document.getElementById("upper-left");

    if(URcheck){
      let URarray, LLarray, LRarray, ULarray;

      if (props.gscRuins){
        URarray = ["201-a", "201-b", "201-c", "201-d", "201-e", "201-f", "201-g", "201-h", "201-i", "201-j", "201-k"];
        LLarray = ["201-l", "201-m", "201-n", "201-o", "201-p", "201-q", "201-r"];
        LRarray = ["201-s", "201-t", "201-u", "201-v", "201-w"];
        ULarray = ["201-x", "201-y", "201-z"];
      } else {
        URarray = ["201-a", "201-b", "201-c", "201-d", "201-e", "201-f", "201-g", "201-h", "201-i", "201-j"];
        LLarray = ["201-k", "201-l", "201-m", "201-n", "201-o", "201-p", "201-q"];
        LRarray = ["201-r", "201-s", "201-t", "201-u", "201-v"];
        ULarray = ["201-w", "201-x", "201-y", "201-z"];
      }

      const tempArray = [];

      const pushUnownForms = (arr, tempArray) => {
        arr.forEach((e) => {
          tempArray.push(
            {
              "number": e,
              "minLevel": 5,
              "rate": props.gscRuins ? e === "201-z" ? "0.0234375" : "0.0390625" : "0.038461538"
            }
          );
        });
      };

      if (URcheck.checked){
        pushUnownForms(URarray, tempArray);
      }
      if (LLcheck.checked){
        pushUnownForms(LLarray, tempArray);
      }
      if (LRcheck.checked){
        pushUnownForms(LRarray, tempArray);
      }
      if (ULcheck.checked){
        pushUnownForms(ULarray, tempArray);
      }

      let holdRate = 0;
      tempArray.forEach((e) => {
        holdRate += Number(e.rate);
      })
      const rateMod = 1/holdRate;
      tempArray.forEach((e) => {
        e.rate = e.rate * rateMod;
      });

      props.setEncounters(tempArray);
    }
  };

  useEffect(() => {
    if(props.gscRuins){
      handleChange();
    } else if(props.hgssRuins){
      handleChange();
    }  
    else{
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.gscRuins || props.hgssRuins){
    return(
      <div id="gscRuinsArea" class="modChunk">
        <fieldset class="ruinsFieldset" onChange={handleChange}>
          <legend>Select completed puzzles</legend>
          <div>
            <label for="upper-right">Upper Right: </label>
            <input type="checkbox" id="upper-right"/>
          </div>
          <div>
            <label for="lower-left">Lower Left: </label>
            <input type="checkbox" id="lower-left"/>
          </div>
          <div>
            <label for="lower-right">Lower Right: </label>
            <input type="checkbox" id="lower-right"/>
          </div>
          <div>
            <label for="upper-left">Upper Left: </label>
            <input type="checkbox" id="upper-left"/>
          </div>
        </fieldset>
      </div>
    )
  }
};

const DppRadarSection = (props) => {

  const handleChange = () => {
    if(document.getElementById("radar").checked){
      const tempArray = JSON.parse(JSON.stringify(props.encounters));
      const radarEncountersArr = props.dppRadar.split(",");
      tempArray[4].number = radarEncountersArr[0];
      tempArray[5].number = radarEncountersArr[1];
      tempArray[10].number = radarEncountersArr[2];
      tempArray[11].number = radarEncountersArr[3];
      props.setEncounters(tempArray);
      props.setRadarActive(true);
    } else {
      props.setEncounters(props.encounters);
      props.setRadarActive(false);
    }
  };

  useEffect(() => {
    if(props.dppRadar){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.dppRadar){
    return(
      <div id="dppRadarArea" class="modChunk">
        <label for="radar">Radar?</label>
        <div class="checkboxDiv">
          <input type="checkbox" id="radar" onChange={handleChange}/>
        </div>
      </div>
    )
  }

};

const DppTrophySection = (props) => {

  const handleChange = () => {
    const dailyPokemonArr = ["35", "39", "52", "113", "133", "137", "173", "174", "183", "298", "311", "312", "351", "438", "439", "440"];
    if (props.game === "platinum"){
      dailyPokemonArr = ["35", "39", "52", "113", "132", "133", "173", "174", "183", "298", "311", "312", "351", "438", "439", "440"];
    }
    const currentSelect = document.getElementById("currentDaily");
    const currentSelectValue = currentSelect.value;
    const previousSelect = document.getElementById("yesterdayDaily");
    const previousDiv = document.getElementById("yesterdayDailyDiv");
    let previousSelectValue = previousSelect.value;

    let currentHTML = `<option value="0">None</option>`;
    dailyPokemonArr.forEach(e => {
      const pokemon = findName(e, props.pokemonArr);
      currentHTML += `<option value=${e}>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</option>`
    });
    currentSelect.innerHTML = currentHTML;
    currentSelect.value = currentSelectValue;

    let previousHTML = `<option value="0">None</option>`;
    if (currentSelectValue !== "0"){
      previousSelect.disabled = false;
      previousDiv.classList = "select select--enabled";
      dailyPokemonArr.forEach(e => {
        const pokemon = findName(e, props.pokemonArr);
        previousHTML += (e === currentSelectValue) ? `` : `<option value=${e}>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</option>`;
      });
      previousSelectValue = (currentSelectValue === previousSelectValue) ? "0" : previousSelectValue;
    } else {
      previousSelect.disabled = true;
      previousDiv.classList = "select select--disabled";
      previousSelectValue = "0";
    }
    previousSelect.innerHTML = previousHTML;
    previousSelect.value = previousSelectValue;
    const tempArray = JSON.parse(JSON.stringify(props.encounters));
    tempArray[6].number = (currentSelectValue === "0") ? tempArray[6].number : currentSelectValue;
    tempArray[7].number = (previousSelectValue === "0") ? tempArray[7].number : previousSelectValue;
    props.setEncounters(tempArray);
  };

  useEffect(() => {
    if (props.dppTrophy){
      handleChange();
    } else{
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.dppTrophy){
    return(
      <div id="dppTrophyArea" class="modChunk">
        <label for="currentDaily">Current Daily: </label>
        <div class="select select--enabled">
          <select id="currentDaily" onChange={handleChange}>
            <option value="0">None</option>
          </select>
        </div>
        <label for="yesterdayDaily">Previous Daily: </label>
        <div class="select select--disabled" id="yesterdayDailyDiv">
          <select id="yesterdayDaily" disabled onChange={handleChange}>
            <option value="0">None</option>
          </select>
        </div>
      </div>
    )
  }

};

const DppGreatMarshSection = (props) => {
  const handleChange = () => {
    const greatMarshSelectValue = document.getElementById("greatMarshSelect").value;
    if(greatMarshSelectValue === "0"){
      props.setEncounters(props.encounters);
    } else {
      const tempArray = JSON.parse(JSON.stringify(props.encounters));
      tempArray[6].number = greatMarshSelectValue;
      tempArray[7].number = greatMarshSelectValue;
      props.setEncounters(tempArray);
    }
  };

  useEffect(() => {
    if (props.dppGreatMarsh){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.dppGreatMarsh){
    if (props.game !== "platinum"){ //game is diamond or pearl
      return (
        <div id="dppGreatMarshArea" class="modChunk">
          <label for="greatMarshSelect">Daily Spawn?</label>
          <div class="select select--enabled">
            <select id="greatMarshSelect" onChange={handleChange}>
              <option value="0">None</option>
              <option value="46">Paras</option>
              <option value="55">Golduck</option>
              <option value="102">Exeggcute</option>
              <option value="115">Kangaskhan</option>
              <option value="183">Marill</option>
              <option value="193">Yanma</option>
              <option value="194">Wooper</option>
              <option value="195">Quagsire</option>
              <option value="285">Shroomish</option>
              <option value="298">Azurill</option>
              <option value="315">Roselia</option>
              <option value="316">Gulpin</option>
              <option value="397">Staravia</option>
              <option value="399">Bidoof</option>
              <option value="400">Bibarel</option>
              <option value="451">Skorupi</option>
              <option value="452">Drapion</option>
              <option value="453">Croagunk</option>
              <option value="454">Toxicroak</option>
              <option value="455">Carnivine</option>
            </select>
          </div>
        </div>
      )
    } else { //game is platinum
      return (
        <div id="dppGreatMarshArea" class="modChunk">
          <label for="greatMarshSelect">Daily Spawn?</label>
          <div class="select select--enabled">
            <select id="greatMarshSelect" onChange={handleChange}>
              <option value="0">None</option>
              <option value="46">Paras</option>
              <option value="102">Exeggcute</option>
              <option value="115">Kangaskhan</option>
              <option value="114">Tangela</option>
              <option value="193">Yanma</option>
              <option value="194">Wooper</option>
              <option value="195">Quagsire</option>
              <option value="285">Shroomish</option>
              <option value="316">Gulpin</option>
              <option value="352">Kecleon</option>
              <option value="357">Tropius</option>
              <option value="451">Skorupi</option>
              <option value="452">Drapion</option>
              <option value="453">Croagunk</option>
              <option value="454">Toxicroak</option>
              <option value="455">Carnivine</option>
            </select>
          </div>
        </div>
      )
    }
  }
};

const DppSwarmSection = (props) => {

  const handleChange = () => {
    if (document.getElementById("dppSwarmCheckbox").checked){
      const tempArray = JSON.parse(JSON.stringify(props.encounters));
      tempArray[0].number = props.dppSwarm;
      tempArray[1].number = props.dppSwarm;
      props.setEncounters(tempArray);
    } else {
      props.setEncounters(props.encounters);
    }
  };

  useEffect(() => {
    if (props.dppSwarm){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.dppSwarm){
    return (
      <div id="dppSwarmArea" class="modChunk">
        <label for="dppSwarmCheckbox">Swarm?</label>
        <div class="checkboxDiv">
          <input type="checkbox" id="dppSwarmCheckbox" onChange={handleChange}/>
        </div>
      </div>
    )
  }
};

const DongleSection = (props) => {

  const gamesArr = ["Ruby", "Sapphire", "Emerald", "FireRed", "LeafGreen"];
  const [selectedGame, setSelectedGame] = useState(-1);

  const handleDongleChange = () => {
    const dongleArr = props.dongle.split(",");
    const dongleSelect = document.getElementById("dongleGameSelect");
    let dongleHTML = `<option value="-1">None</option>`
    dongleArr.forEach((e,i) => {
      if (e != ""){
        dongleHTML += `<option value=${i}>${gamesArr[i]}</option>`;
      }
    });
    dongleSelect.innerHTML = dongleHTML;
    dongleSelect.value = selectedGame;
  };

  const handleChange = () => {
    const dongleArr = props.dongle.split(",");
    const dongleSelect = document.getElementById("dongleGameSelect");
    const dongleSelectValue = dongleSelect.value;
    setSelectedGame(dongleSelectValue);

    if (dongleSelectValue != "-1"){
      const tempArray = JSON.parse(JSON.stringify(props.encounters));
      let val1 = dongleArr[dongleSelectValue];
      let val2 = dongleArr[dongleSelectValue];
      if (dongleArr[dongleSelectValue].includes("|")){
        [val1, val2] = dongleArr[dongleSelectValue].split("|");
      }
      tempArray[8].number = val1;
      tempArray[9].number = val2;
      props.setEncounters(tempArray);
    } else {
      props.setEncounters(props.encounters);
    }
  }

  useEffect(() => {
    if (props.dongle){
      handleDongleChange();
      handleChange();
    } else {
      setSelectedGame(-1);
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.dongle){
    return (
      <div id="dongleArea" class="modChunk">
        <label for="dongleGameSelect">GBA game?</label>
        <div class="select select--enabled">
          <select id="dongleGameSelect" onChange={handleChange}>
            <option value="-1">None</option>
          </select>
        </div>
      </div>
    )
  }

};

//The module for the HGSS safari zone
//Certainly the most complicated module
const HgssSafariZoneSection = (props) => {
  //The five variables players in game can change to affect the encounter slots
  const [plainsBlocks, setPlainsBlocks] = useState(0);
  const [forestBlocks, setForestBlocks] = useState(0);
  const [peakBlocks, setPeakBlocks] = useState(0);
  const [waterBlocks, setWaterBlocks] = useState(0);
  const [days, setDays] = useState(0);

  //These are in terms of day. After a level is hit, the multiplier goes up
  //e.g. after waiting 10 in game days, plains blocks are worth 2x instead of 1x
  const plainsMultiplierArr = [10,50,100,150,200,250];
  const forestMultiplierArr = [20,60,110,160,210,250];
  const peakMultiplierArr = [30,70,120,170,220,250];
  const waterMultiplierArr = [40,80,130,180,230,250];

  //players can only place 30 blocks total
  const maxBlocks = 30;

  const totalBlocks = () => {
    return plainsBlocks + forestBlocks + peakBlocks + waterBlocks;
  };

  const checkMax = (oldVal, newVal) => {
    if (newVal < 0){
      return 0;
    } else if (totalBlocks() - oldVal + newVal > maxBlocks){
      return (maxBlocks - (totalBlocks() - oldVal))
    } else {
      return newVal;
    }
  };

  //sees what tier of multiplier the player has earned via days according to the various arrays
  const multiplier = (arr) => {
    for (let i = 0; i < arr.length; i++){
      if (arr[i] > days){
        return i + 1;
      }
    }
    return 7;
  };

  const handlePlainsChange = (event) => {
    setPlainsBlocks(checkMax(plainsBlocks, Number(event.target.value)));
  };

  const handleForestChange = (event) => {
    setForestBlocks(checkMax(forestBlocks, Number(event.target.value)));
  };

  const handlePeakChange = (event) => {
    setPeakBlocks(checkMax(peakBlocks, Number(event.target.value)));
  };

  const handleWaterChange = (event) => {
    setWaterBlocks(checkMax(waterBlocks, Number(event.target.value)));
  };

  const handleDayChange = (event) => {
    const daysTemp = Number(event.target.value);
    if (daysTemp < 0){
      setDays(0);
    } else if (daysTemp > 250){
      setDays(250);
    } else {
      setDays(daysTemp);
    }
  };

  const handleChange = () => {
    //calculates the number of points per type of block
    const pointsArr = [
      plainsBlocks * multiplier(plainsMultiplierArr), 
      forestBlocks * multiplier(forestMultiplierArr),
      peakBlocks * multiplier(peakMultiplierArr),
      waterBlocks * multiplier(waterMultiplierArr)
    ];
    const safariBlocksArr = props.hgssSafariBlocks.split("|");
    const safariSlots = props.hgssSafariSlots.split("|")[props.todIndex].split(",");
    const tempArray = JSON.parse(JSON.stringify(props.encounters));
    let currentIndex = 0;

    //goes through each of the provided block thresholds
    safariBlocksArr.forEach((e, i) => {
      const individualBlocksArr = e.split(",");
      let allBlocksEnough = true;
      //checks each of the 4 types of blocks to see if there is enough points
      for (let j = 0; j < individualBlocksArr.length; j++){
        if (pointsArr[j] < individualBlocksArr[j]){
          allBlocksEnough = false;
        }
      }
      //if all 4 types of blocks are strong enough, replace the pokemon
      //this will always replace the 0th slot first and then the 1st, etc.
      if (allBlocksEnough){
        tempArray[currentIndex].number = safariSlots[i * 2];
        tempArray[currentIndex].minLevel = safariSlots[i * 2 + 1];
        if (tempArray[currentIndex].maxLevel){
          tempArray[currentIndex].maxLevel = safariSlots[i * 2 + 1];
        }
        currentIndex++;
      }
    });
    props.setEncounters(tempArray);
  };

  useEffect(() => {
    if (props.hgssSafariBlocks){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters, props.todIndex, plainsBlocks, forestBlocks, peakBlocks, waterBlocks, days]);

  useEffect(() => {
    setPlainsBlocks(0);
    setForestBlocks(0);
    setPeakBlocks(0);
    setWaterBlocks(0);
    setDays(0);
  }, [props.primeEncounters]);

  if (props.hgssSafariBlocks){
    return ( 
      <div class="modChunk">
        <fieldset class="safariFieldset">
          <legend>Blocks {totalBlocks()}/{maxBlocks}</legend>
          <div id="hgssSafariZoneArea">
            <div>
              <label for="plainsInput">Plains Blocks:</label>
              <input 
                id="plainsInput" 
                type='number' 
                value={plainsBlocks.toString()} 
                onChange={handlePlainsChange} 
                onKeyDown={(evt) => !(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"].includes(evt.key)) && evt.preventDefault()}
              />
            </div>
            <div>
              <label for="forestInput">Forest Blocks:</label>
              <input 
                id="forestInput" 
                type='number' 
                value={forestBlocks.toString()} 
                onChange={handleForestChange} 
                onKeyDown={(evt) => !(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"].includes(evt.key)) && evt.preventDefault()}
              />
            </div>
            <div>
              <label for="peakInput">Peak Blocks:</label>
              <input 
                id="peakInput" 
                type='number' 
                value={peakBlocks.toString()} 
                onChange={handlePeakChange} 
                onKeyDown={(evt) => !(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"].includes(evt.key)) && evt.preventDefault()}
              />
            </div>
            <div>
              <label for="waterInput">Water Blocks:</label>
              <input 
                id="waterInput" 
                type='number' 
                value={waterBlocks.toString()} 
                onChange={handleWaterChange} 
                onKeyDown={(evt) => !(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"].includes(evt.key)) && evt.preventDefault()}
              />
            </div>
            <div>
              <label for="dayInput">Days:</label>
              <input 
                id="dayInput" 
                type='number' 
                value={days.toString()} 
                onChange={handleDayChange} 
                onKeyDown={(evt) => !(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"].includes(evt.key)) && evt.preventDefault()}
              />
            </div>
          </div>
        </fieldset>
      </div>
    )
  }
};

const HgssRadioSection = (props) => {
  const handleSound = (arr) => {
    const tempArray = JSON.parse(JSON.stringify(props.encounters));
    arr.forEach((e, i) => {
      tempArray[i + 2].number = e;
    });
    props.setEncounters(tempArray);
  };

  const handleChange = () => {
    const sound = document.getElementById("radioSelect").value;
    if (sound != "-1"){ //hoenn sound is 0. sinnoh sound is 1.
      handleSound(props.radio.split("|")[sound].split(","));
    } else {
      props.setEncounters(props.encounters);
    }
  };

  useEffect(() => {
    if (props.radio){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.radio){
    return (
      <div id="hgssRadioArea" class="modChunk">
        <label for="radioSelect">Radio?</label>
        <div class="select select--enabled">
          <select id="radioSelect" onChange={handleChange}>
            <option value="-1" selected>None</option>
            <option value="0">Hoenn</option>
            <option value="1">Sinnoh</option>
          </select>
        </div>
      </div>
    )
  }
};

const AbilitySection = (props) => {
  const [abilityHTML, setAbilityHTML] = useState("");
  const [leadLevel, setLeadLevel] = useState();

  const typeModAbility = (type, rate) => {
    const tempArray = JSON.parse(JSON.stringify(props.encounters));
    const foundType = [];

    tempArray.forEach((e) => {
      const pokemon = findName(e.number, props.pokemonArr);
      if (pokemon.type1 === type || pokemon.type2 === type){
        foundType.push(JSON.parse(JSON.stringify(e)));
      }
    });

    if(foundType.length > 0){
      tempArray.forEach((e) => {
        e.rate = e.rate * (1-rate);
      });
      const additionalRate = rate/foundType.length;
      foundType.forEach((e) => {
        e.rate = additionalRate;
        tempArray.push(e);
      });
    }

    return tempArray;
  };

  const intimidateAbility = (levelInt) => {
    const tempArray = [];
    
    props.encounters.forEach((e) => {
      
      const minLevel = Number(e.minLevel);
      const maxLevel = Number(e.maxLevel);

      if (typeof levelInt == "undefined" || minLevel > Number(levelInt) - 5){
        tempArray.push(e);
      } else if (maxLevel > levelInt - 5){ //the max level is large enough to not be affected by Intimidate but min level is not large enough
        const numLevels = maxLevel - minLevel + 1;
        const ratePerLevel = e.rate / numLevels;
        const numLevelsNotAffected = maxLevel - levelInt + 4;
        const numLevelsAffected = numLevels - numLevelsNotAffected;
        const totalRate = numLevelsAffected * ratePerLevel * 0.5 + numLevelsNotAffected * ratePerLevel;
        tempArray.push({"number": e.number, "minLevel": minLevel, "maxLevel": maxLevel, "rate": totalRate});
      } else {
        tempArray.push({"number": e.number, "minLevel": minLevel, "maxLevel": maxLevel, "rate": e.rate * 0.5});
      }
    });

    return tempArray;
  };

  const hustleAbility = () => {
    const tempArray = JSON.parse(JSON.stringify(props.encounters));
    if (!props.encounters[1].maxLevel){ //hustle affects encounters differently if there is a level spread in a slot (by species)
      const tempSpecies = [];
      const tempRates = [];
      const index = [];
      //go through everything in the current encounters
      tempArray.forEach((e, p) => {
        e.rate = Number(e.rate)/2;
        let newSpecies = true;
        //check to see if this is the first of a species in the current encounters
        tempSpecies.forEach((j, i) => {
          if(j == e.number){
            newSpecies = false;
            tempRates[i] += Number(e.rate); //all rates need to be halved and later the one with the highest level of the species will get all the removed rates
            if(Number(e.minLevel) > Number(tempArray[index[i]].minLevel)){ //find highest level of species
              index[i] = p;
            }
          }
        });
        //if it is the first of a species save its species number, half its rate, and its index in encounters
        if (newSpecies){
          tempSpecies.push(e.number);
          tempRates.push(Number(e.rate));
          index.push(p);
        }
      });
      
      index.forEach((e, i) => {
        tempArray[e].rate += Number(tempRates[i]); //add the removed rates to the highest level of each species
      });
      return tempArray;
    } else{ //there is a level spread
      const exemptGames = ["emerald", "diamond", "pearl", "platinum", "heartgold", "soulsilver"];
      const tempSlots = [];
      if (exemptGames.includes(props.game)){ //exempt games handles hustle differently than others (by slot)
        //go through each encounter slot and half the rate. record the species, the max level, the rate
        tempArray.forEach(e => {
          const rate = e.rate / 2;
          e.rate = rate;
          tempSlots.push({"number": e.number, "minLevel": e.maxLevel, "maxLevel": e.maxLevel, "rate": rate});
        });
      } else{ //by species but differently than the above without a level spread
        //go through each slot and find the slot with the same species with the highest max level
        tempArray.forEach(e => {
          let max = e.maxLevel;
          tempArray.forEach(j => {
            if (j.number === e.number && j.maxLevel > max){
              max = j.maxLevel;
            }
          });
          //once max level has been found, calculate new slots
          const rate = e.rate / 2;
          e.rate = rate;
          if (max >= e.maxLevel + 5){ //large enough gap so you only need one new slot
            tempSlots.push({"number": e.number, "minLevel": e.minLevel + 5, "maxLevel": e.maxLevel + 5, "rate": rate});
          } else if (e.minLevel + 5 > max){ //every level will be raised to max
            tempSlots.push({"number": e.number, "minLevel": max, "maxLevel": max, "rate": rate});
          } else { //we need two slots since levels cannot go past max and multiple will hit the max so the max level will have a higher percentage
            const maxingOutLevels = max - e.maxLevel; //num levels that will hit the max
            const numLevels = e.maxLevel - e.minLevel + 1; //total num levels
            const otherLevels = e.maxLevel + numLevels - max; //num levels that will be lifted but not maxed
            const ratePerLevel = rate / numLevels;
            tempSlots.push({"number": e.number, "minLevel": e.minLevel + 5, "maxLevel": max - 1, "rate": ratePerLevel * otherLevels});
            tempSlots.push({"number": e.number, "minLevel": max, "maxLevel": max, "rate": ratePerLevel * maxingOutLevels});
          }
        });
      }
      return tempArray.concat(tempSlots);
    }
  }

  const cuteCharmAbility = (gender) => {
    const tempArray = JSON.parse(JSON.stringify(props.encounters));
    tempArray.forEach(e => {
      if(!e.genderBias){ //gender hasn't been set to default by swarms
        //set the gender bias caused by cute charm
        e.genderBias = gender;
      }
    });
    return tempArray;
  };

  const handleChange = () => {
    props.setIntimidateActive(false);
    const leadLevelInput = document.getElementById("leadLevelInput");
    const leadLevelSection = document.getElementById("leadLevelSection");
    const leadGenderSection = document.getElementById("leadGenderSection");
    leadLevelInput.disabled = true;
    leadLevelSection.style.display = "none";
    leadGenderSection.style.display = "none";
    const dropdown = document.getElementById("abilitySelect");
    if(dropdown && dropdown.value !== "none"){
      //sword and shield handle abilities differently
      if (props.game !== "sword" && props.game !== "shield"){
        switch (dropdown.value){
          case "static":
            props.setEncounters(typeModAbility("electric", 0.5));
            break;
          case "magnet pull":
            props.setEncounters(typeModAbility("steel", 0.5));
            break;
          case "keen eye":
          case "intimidate":
            if (!props.radarActive){
              leadLevelInput.disabled = false;
              leadLevelSection.style.display = "flex";
              props.setEncounters(intimidateAbility(leadLevel));
              props.setIntimidateActive(true);
            } else {
              leadLevelInput.value = "";
              props.setEncounters(props.encounters);
            }
            break;
          case "hustle":
          case "pressure":
          case "vital spirit":
            props.setEncounters(hustleAbility());
            break;
          case "cute charm":
            leadGenderSection.style.display = "block";
            if (document.getElementById("maleGenderRadio").checked){ //male checked
              props.setEncounters(cuteCharmAbility("male"));
            } else if (document.getElementById("femaleGenderRadio").checked){ //female checked
              props.setEncounters(cuteCharmAbility("female"));
            } else { //neither checked
              document.getElementById("maleGenderRadio").checked = true;
              props.setEncounters(cuteCharmAbility("male"));
            }
          default:
            break;
        }
      }
    } else {
      props.setEncounters(props.encounters);
    }
  };

  const handleLevelChange = (event) => {
    let holdLeadLevel = Number(event.target.value).toString(); //Number to string gets rid of leading zeros 
    if(holdLeadLevel > 100){
      holdLeadLevel = 100;
    } else if (holdLeadLevel <= 0){
      holdLeadLevel = "";
    }
    setLeadLevel(holdLeadLevel);
    props.setEncounters(intimidateAbility(holdLeadLevel));
  };

  const handleGenderChange = () => {
    let gender = "male";
    if (document.getElementById("femaleGenderRadio").checked){
      gender = "female";
    }
    props.setEncounters(cuteCharmAbility(gender));
  };

  useEffect(() => {
    if(props.ability){
      handleChange();
    } else {
      props.setEncounters(props.encounters);
    }
    props.setIntimidateActive(false);
    setLeadLevel();
  }, [props.encounters]);

  //updates the HTML of the dropdown depending on the variable
  useEffect(() => {
    if (props.ability){
      let tempHTML = "<option value='none' selected>None</option>";
      const abilityArray = props.ability.split("|");
      abilityArray.forEach((e) => {
        tempHTML += `<option value="${e}">${e}</option>`
      });
      setAbilityHTML(tempHTML);
    }
  }, [props.ability]);

  if (props.ability){
    return (
      <div id="abilityArea" class="modChunk">
        <label for="abilitySelect">Ability: </label>
        <div class="select select--enabled">
          <select id="abilitySelect" onChange={handleChange} dangerouslySetInnerHTML={{__html: abilityHTML}}>
          </select>
        </div>
        <div id="leadLevelSection" class="innerDiv">
          <label for="leadLevelInput">Lead Level: </label>
          <input 
            id="leadLevelInput" 
            type='number' 
            value={leadLevel} 
            onChange={handleLevelChange} 
            onKeyDown={(evt) => ["e", "E", "+", "-", "."].includes(evt.key) && evt.preventDefault()}
            disabled
          />
        </div>
        <div id="leadGenderSection" class="innerDiv">
          <fieldset onChange={handleGenderChange}>
            <legend>Lead Gender: </legend>
            <input type="radio" id="maleGenderRadio" name="genderRadio" value="male"/>
            <label for="maleGenderRadio">Male</label><br />
            <input type="radio" id="femaleGenderRadio" name="genderRadio" value="female" />
            <label for="femaleGenderRadio">Female</label>
          </fieldset>
        </div>
      </div>
    )
  }
};

//pie chart of encounter percentages
const PieChart = (props) => {
  const svgRef = useRef();

  useEffect(() => {
    d3.select('#pie-container')
      .select('svg')
      .remove();

    //set up svg container
    const w = window.innerHeight * 0.45;
    const h = window.innerHeight * 0.45;
    const radius = w / 2;
    const innerRadius = w / 4;
    const svg = d3.select('#pie-container')
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .style('overflow', 'visible')
      .style('margin', 'auto');

    //set up chart
    const formattedData = d3.pie().value(d => d.rate)(props.data);
    const arcGenerator = d3.arc().innerRadius(innerRadius).outerRadius(radius);
    const color = d3.scaleOrdinal().range(d3.schemeSet2);
    color.domain([0,100]);

    //set up svg data
    svg.selectAll()
      .data(formattedData)
      .join('path')
        .attr('d', arcGenerator)
        .attr('fill', d => color(Math.round(d.data.rate * 10000) / 100))
        .attr('transform', 'translate(' + w/2 + ',' + h/2 + ')')
        .style('opacity', 1.0)
        .style('stroke', "black")
        .style('stroke-width', "2px");

    //set up annotation
    svg.selectAll()
      .data(formattedData)
      .join('text')
        .text(d => {
          const name = findName(d.data.number, props.pokemonArr).name
          return name.charAt(0).toUpperCase() + name.slice(1)
        })
        .attr("transform", function(d){
          return 'translate(' + w/2 + ',' + h/2 + ') translate(' + arcGenerator.centroid(d) + ')';
        })
        .style('text-anchor', 'middle')
        .style('font-family', 'Roboto');
  }, [props.data]);

  if (props.data.length > 0){
    return (
      <div id="pie-container" class="pieChartDiv">
        <svg ref={svgRef}></svg>
        {/* <img class="pokeballTop" src="./resources/images/pokeball.png" alt="Pokeball Image"/> */}
      </div>
    );
  }
}

const App = () => {

  //State variables for program
  //Data pulled from JSONs. Pokemon Data is every pokemon's data
  //Encounter Data is complete data of the selected game
  const [encounterData, setEncounterData] = useState({});
  const [pokemonData, setPokemonData] = useState({});
  //The area in the game that is being encountered
  const [selectedArea, setSelectedArea] = useState("");
  const [game, setGame] = useState("");
  //The arrays of encounters
  const [encounters, setEncouters] = useState([]); //The raw encounter data
  const [todEncounters, setTodEncounters] = useState([]);//encounters modified by time of day
  const [gscSwarmEncounters, setGscSwarmEncounters] = useState([]);//encounters modified by swarms in Gold, Silver, and Crystal
  const [rseSwarmEncounters, setRseSwarmEncounters] = useState([]);//encounters modified by swarms in Ruby, Sapphire, and Emerald
  const [gscRuinsEncounters, setGscRuinsEncounters] = useState([]); //encounters modified in the Ruins of Alph in GSC
  const [dppRadarEncounters, setDppRadarEncounters] = useState([]); //encounters modified by Diamond, Pearl, and Platinum Radar
  const [dppTrophyEncounters, setDppTrophyEncounters] = useState([]); //encounters modified by the DPP Trophy Garden
  const [dppGreatMarshEncounters, setDppGreatMarshEncounters] = useState([]); //encounters modified by the DPP Great Marsh daily spawns
  const [dppSwarmEncounters, setDppSwarmEncounters] = useState([]); //encounters modified by DPP or HGSS Swarms
  const [dongleEncounters, setDongleEncounters] = useState([]); //encounters modified by GBA slot in DPP
  const [hgssSafariEncounters, setHgssSafariEncounters] = useState([]); //encounters modified by blocks in the heartgold or soulsilver safari zone
  const [hgssRadioEncounters, setHgssRadioEncounters] = useState([]); //ecounters modified by the radio in HGSS
  const [abilityEncounters, setAbilityEncounters] = useState([]);//encounters modified by abilities such as static
  const [repelEncounters, setRepelEncounters] = useState([]); //encounters modified by repels
  //variables that come with the encounters such as if a repel can be used
  const [variables, setVariables] = useState({});
  //variables created by user inputs that have to be passed between componenents
  const [todIndex, setTodIndex] = useState(1);
  const [intimidateActive, setIntimidateActive] = useState(false);
  const [radarActive, setRadarActive] = useState(false);
  //sprite extension based on game
  const [spriteExtension, setSpriteExtension] = useState('');
  //whether to use game specific sprites or just 3d home models
  const [useModels, setUseModels] = useState("sprites");
  //whether to use shiny sprites or regular
  const [useShiny, setUseShiny] = useState(false);
  //which gender spreads to use
  const [genderSpread, setGenderSpread] = useState(0);

  //Function to get the pokemon species
  const fetchPokemonData = async () => {
    try {
      const response = await fetch("https://purplemoonlight97.github.io/PokemonJSON/pokemon.json");
      const data = await response.json();
      setPokemonData(data);
    } catch (error) {
      alert("problem collecting pokemon data");
    }
  };

  //Function to get the encounters of the selected game
  const fetchEncounterData = async (game) => {
    try {
      const response = await fetch("https://purplemoonlight97.github.io/PokemonJSON/" + game + ".json");
      const data = await response.json();
      setEncounterData(data);
      const areasArray = Object.keys(data);
      let areasHTML = `<option value="" selected disabled hidden>Choose Area</option>`;
      areasArray.forEach((e) => {
        areasHTML += `<option value="${e}">${e}</option>`
      });
      const areasElement = document.getElementById("areas");
      const areasDiv = document.getElementById("areasDiv");
      areasElement.innerHTML = areasHTML;
      areasElement.disabled = false;
      areasDiv.classList.remove("select--disabled");
      areasDiv.classList.add("select--enabled");
    } catch {
      alert("problem collecting encounter data");
    }
  };

  //on load
  useEffect(() => {
    //load in the pokemon data
    fetchPokemonData();

    //settings dropdowns
    const themeSelect = document.getElementById("themeSelect");
    const shinySelect = document.getElementById("shinySelect");
    const modelSelect = document.getElementById("modelSelect");

    //load in the theme
    const themeValue = localStorage.getItem("theme");
    if (themeValue){
      themeSelect.value = themeValue;
      changeTheme(themeValue);
    }

    //load in the shiny setting
    const shinyValue = localStorage.getItem("shiny");
    if (shinyValue){
      shinySelect.value = shinyValue;
      changeShiny(shinyValue);
    } else{
      changeShiny(false);
    }

    //load in the appropriate models
    const modelValue = localStorage.getItem("model");
    if (modelValue){
      modelSelect.value = modelValue;
      changeModel(modelValue);
    } else{
      changeModel("sprites");
    }
  }, []);

  useEffect(() => {
    //update the images so they can be clicked for shiny/not shiny
    handleProcessedImagesChange();
  }, [repelEncounters, useModels, useShiny]);

  //reset everything
  const clearEncounters = () => {
    setEncouters([]);
    setVariables({});
    document.getElementById("encounterSlots").style.display = "none";
    document.getElementById("processedEncounters").style.display = "none";
  };

  //Get all the images in the processed html section.
  //These need to be made clickable so that they can alternate between shiny and not shiny.
  const handleProcessedImagesChange = () => {
    const images = document.querySelectorAll('[class^="shinyFlip"]');
    images.forEach(e => {
      e.addEventListener("click", shinyFlip);
    })
  };

  //which game has been selected has changed
  const handleGameChange = (event) => {
    fetchEncounterData(event.target.value);
    setGame(event.target.value);
    clearEncounters();
    switch (event.target.value){
      case "red":
      case "blue - INT":
      case "blue - JPN":
        setSpriteExtension("gen1/rb");
        setGenderSpread(1);
        break;
      case "yellow":
        setSpriteExtension("gen1/yellow");
        setGenderSpread(1);
        break;
      case "gold":
      case "gold - JPN":
        setSpriteExtension("gen2/gold");
        setGenderSpread(2);
        break;
      case "silver":
      case "silver - JPN":
        setSpriteExtension("gen2/silver");
        setGenderSpread(2);
        break;
      case "crystal":
        setSpriteExtension("gen2/crystal");
        setGenderSpread(2);
        break;
      case "ruby":
      case "sapphire":
        setSpriteExtension("gen3/rs");
        setGenderSpread(3);
        break;
      case "emerald":
        setSpriteExtension("gen3/emerald");
        setGenderSpread(3);
        break;
      case "firered":
      case "leafgreen":
        setSpriteExtension("gen3/frlg");
        setGenderSpread(3);
        break;
      case "diamond":
      case "pearl":
        setSpriteExtension("gen4/dp");
        setGenderSpread(4);
        break;
      case "platinum":
        setSpriteExtension("gen4/platinum");
        setGenderSpread(4);
        break;
      case "heartgold":
      case "soulsilver":
        setSpriteExtension("gen4/hgss");
        setGenderSpread(4);
        break;
      default:
        setSpriteExtension("gen6");
    }
    const methodElement = document.getElementById("methods");
    methodElement.innerHTML = `<option value="" selected disabled hidden>Choose Area First</option>`;
    methodElement.disabled = true;
    document.getElementById("methodsDiv").classList = ("select select--enabled");
  };

  //Once an area is selected, load the available encounter methods such as walking, fishing, surfing
  const handleAreaChange = (event) => {
    const areaSelected = event.target.value;
    clearEncounters();
    setSelectedArea(areaSelected);
    const methodsArray = Object.keys(encounterData[areaSelected]);
    let methodsHTML = `<option value="" selected disabled hidden>Choose Method</option>`;
    methodsArray.forEach((e) => {
      methodsHTML += `<option value="${e}">${e}</option>`;
    });
    const methodElement = document.getElementById("methods");
    const methodsDiv = document.getElementById("methodsDiv");
    methodElement.innerHTML = methodsHTML;
    methodElement.disabled = false;
    methodsDiv.classList = ("select select--enabled");
  };

  //which method of encounters has changed (walking, surfing, fishing, etc.)
  const handleMethodChange = (event) => {
    let tempArray = Object.values(encounterData[selectedArea][event.target.value]);
    clearEncounters();
    document.getElementById("encounterSlots").style.display = "flex";
    document.getElementById("processedEncounters").style.display = "flex";
    setVariables(Object.keys(encounterData[selectedArea][event.target.value])[tempArray.length - 1] === "variables" ? tempArray.pop() : {});
    setEncouters(tempArray);
    const methodsDiv = document.getElementById("methodsDiv");
    const methods = document.getElementById("methods");

    if (methods.value.includes("Walk")){
      methodsDiv.classList = ("select select--walk");
    } else if(methods.value.includes("Rod")) {
      methodsDiv.classList = ("select select--fishing");
    } else if(methods.value.includes("Surf")){
      methodsDiv.classList = ("select select--surf");
    } else if(methods.value.includes("Smash")){
      methodsDiv.classList = ("select select--rsmash");
    } else if(methods.value.includes("butt")){
      methodsDiv.classList = ("select select--headbutt");
    }else {
      methodsDiv.classList = ("select select--enabled");
    }
  };

  const changeTheme = (str) => {
    //colors are in the order of primary, primarylight, text,
    //textlight, secondary, tertiary, highlight
    let colorsArr = ["#F2F4F3", "#0A0F0D", "#0A0F0D", "#F2F4F3", "#0091AD", "#A31621", "#EA3788"];
    const colorVar = ["--primary", "--primaryLight", "--text", "--textLight", "--secondary", "--tertiary", "--highlight"];

    switch (str){
      case "light":
        break;
      case "dark":
        colorsArr = ["#0A0F0D", "#F2F4F3", "#F2F4F3", "#0A0F0D", "#0091AD", "#A31621", "#EA3788"];
        break;
    }

    const root = document.documentElement;
    colorVar.forEach((e, i) => {
      root.style.setProperty(e, colorsArr[i]);
    });
  };

  const handleThemeChange = (event) => {
    const value = event.target.value;
    localStorage.setItem("theme", value);
    changeTheme(value);
  };

  const changeShiny = (str) => {
    setUseShiny(str === "shiny");
  };

  const handleShinyChange = (event) => {
    const value = event.target.value;
    localStorage.setItem("shiny", value);
    changeShiny(value);
  };

  const changeModel = (str) => {
    setUseModels(str);
  };

  const handleModelChange = (event) => {
    const value = event.target.value;
    localStorage.setItem("model", value);
    changeModel(value);
  };

  return(
    <div>
      <h2>Pokemon Encounter Calculator Remastered:</h2>
      <div class="imageHolder">
        <img src="./resources/images/Hildawalkdown.png" alt='trainer'/>
        <img src="./resources/images/Dawn.png" alt='trainer'/>
        <img src="./resources/images/Lyra.png" alt='trainer'/>
        <img src="./resources/images/Ethan.png" alt='trainer'/>
        <img src="./resources/images/Lucas.png" alt='trainer'/>
      </div>
      <div id="controls" class="controlsHolder">
        <div id="selections" class="controlsDiv">
          <div>
            <label for="games">Game: </label>
            <div class="select select--enabled">
              <select id="games" onChange={handleGameChange}>
                <option value="" selected disabled hidden>Choose Game</option>
                <option value="red">Red</option>
                <option value="blue - INT">Blue - INT/Green - JPN</option>
                <option value="blue - JPN">Blue - JPN</option>
                <option value="yellow">Yellow</option>
                <option value="gold">Gold - INT</option>
                <option value="gold - JPN">Gold - JPN/KOR</option>
                <option value="silver">Silver - INT</option>
                <option value="silver - JPN">Silver - JPN/KOR</option>
                <option value="crystal">Crystal</option>
                <option value="ruby">Ruby</option>
                <option value="sapphire">Sapphire</option>
                <option value="emerald">Emerald</option>
                <option value="firered">FireRed</option>
                <option value="leafgreen">LeafGreen</option>
                <option value="diamond">Diamond</option>
                <option value="pearl">Pearl</option>
                <option value="platinum">Platinum</option>
                <option value="heartgold">HeartGold</option>
                <option value="soulsilver">SoulSilver</option>
              </select>
              <span class="focus"></span>
            </div>
          </div>
          <div>
            <label for="areas">Area: </label>
            <div class="select select--disabled" id="areasDiv">
              <select id="areas" onChange={handleAreaChange} disabled>
                <option value="" selected disabled hidden>Choose Game First</option>
              </select>
              <span class="focus"></span>
            </div>
          </div>
          <div>
            <label for="methods">Method: </label>
            <div class="select select--disabled" id="methodsDiv">
              <select id="methods" onChange={handleMethodChange} disabled>
                <option value="" selected disabled hidden>Choose Area First</option>
              </select>
              <span class="focus"></span>
            </div>
          </div>
        </div>
        <div id="settings"  class="controlsDiv">
          <div>
            <label for="themeSelect">Theme: </label>
            <div id="themeSelectDiv" class="select select--enabled">
              <select id="themeSelect" onChange={handleThemeChange}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <span class="focus"></span>
            </div>
          </div>
          <div>
            <label for="shinySelect">Color: </label>
            <div id="shinySelectDiv" class="select select--enabled">
              <select id="shinySelect" onChange={handleShinyChange}>
                <option value="normal">Normal</option>
                <option value="shiny">Shiny</option>
              </select>
            </div>
          </div>
          <div>
            <label for="modelSelect">Models: </label>
            <div id="modelSelectDiv" class="select select--enabled">
              <select id="modelSelect" onChange={handleModelChange}>
                <option value="sprites">In-Game</option>
                <option value="home">Home</option>
                <option value="official">Official Artwork</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div id="encounterSlots" dangerouslySetInnerHTML={encounterHTMLGenerator(hgssRadioEncounters, spriteExtension, pokemonData, useShiny, useModels)} style={{display: "none"}}></div>
      <div class="modChunkHolder">
        <TimeOfDaySection tod={variables.tod} setTodIndex={setTodIndex} encounters={encounters} setEncounters={setTodEncounters}/>
        <GscSwarmSection gscSwarm={variables.gscSwarm} todIndex={todIndex} encounters={todEncounters} setEncounters={setGscSwarmEncounters}/>
        <RseSwarmSection rseSwarm={variables.rseSwarm} encounters={gscSwarmEncounters} setEncounters={setRseSwarmEncounters}/>
        <GscRuinsSection gscRuins={variables.gscRuins} hgssRuins={variables.hgssRuins} encounters={rseSwarmEncounters} setEncounters={setGscRuinsEncounters}/>
        <DppRadarSection dppRadar={variables.dppRadar} encounters={gscRuinsEncounters} setEncounters={setDppRadarEncounters} setRadarActive={setRadarActive}/>
        <DppTrophySection dppTrophy={variables.dppTrophy} encounters={dppRadarEncounters} setEncounters={setDppTrophyEncounters} pokemonArr={pokemonData} game={game}/>
        <DppGreatMarshSection dppGreatMarsh={variables.dppGreatMarsh} encounters={dppTrophyEncounters} setEncounters={setDppGreatMarshEncounters} pokemonArr={pokemonData} props={game}/>
        <DppSwarmSection dppSwarm={variables.dppSwarm} encounters={dppGreatMarshEncounters} setEncounters={setDppSwarmEncounters}/>
        <DongleSection dongle={variables.dongle} encounters={dppSwarmEncounters} setEncounters={setDongleEncounters}/>
        <HgssSafariZoneSection hgssSafariBlocks={variables.hgssSafariBlocks} hgssSafariSlots={variables.hgssSafariSlots} todIndex={todIndex} primeEncounters={encounters} encounters={dongleEncounters} setEncounters={setHgssSafariEncounters}/>
        <HgssRadioSection radio={variables.radio} encounters={hgssSafariEncounters} setEncounters={setHgssRadioEncounters}/>
        <AbilitySection ability={variables.ability} encounters={hgssRadioEncounters} setEncounters={setAbilityEncounters} pokemonArr={pokemonData} setIntimidateActive={setIntimidateActive} radarActive={radarActive} game={game}/>
        <RepelSection repel={variables.repel} primeEncounters={encounters} encounters={abilityEncounters} setEncounters={setRepelEncounters} intimidateActive={intimidateActive} radarActive={radarActive} game={game}/>
      </div>
      <div id="processedEncounters"
        dangerouslySetInnerHTML={
          repelEncounters.length === 0 ? 
          {__html: ""} : 
          processedEncountersHTMLGenerator(condenseEncounters(repelEncounters), spriteExtension, pokemonData, genderSpread, useShiny, useModels)
        }
        style={{display: "none"}}
      >
      </div>
      <PieChart data={condenseEncounters(repelEncounters)} pokemonArr={pokemonData}/>
    </div>
  )
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div>
    <App/>
  </div>
);