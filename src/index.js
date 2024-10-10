import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

//takes a number and returns the species name of a pokemon
const findName = (num, arr) => {
  let name = "missingno."
  for (const e of arr){
    if (e.number === num){
      name = e.name;
      break;
    }
  };
  return name;
};

//converts an array of encounters into HTML for output
const encounterHTMLGenerator = (arr, str, pokemonArr) => {
  let tempHTML = ``;
  arr.forEach(e => {
    tempHTML += `
      <div class="encounterSlot">
        <img src="${process.env.PUBLIC_URL + '/resources/' + str + '/' + e.number + '.png'}" />
        <span>Species: ${findName(e.number, pokemonArr)}</span>
        <span>Level: ${e.minLevel}${('maxLevel' in e) ? "-" + e.maxLevel : ""}</span>
        <span>Rate: ${Math.round(e.rate * 10000)/100}%</span>
      </div>
    `;
  });
  return {__html: tempHTML};
};

//converts an array of processed (repels, abilities, etc.) into HTML for output
const processedEncountersHTMLGenerator = (arr, str, pokemonArr) => {
  let tempHTML = ``;
  let encounterRate = 0;
  arr.forEach(e => {
    encounterRate += Number(e.rate);
  });
  let modifier = 100/encounterRate;
  arr.forEach(e => {
    tempHTML += `
      <div class="encounterSlot">
        <img src="${process.env.PUBLIC_URL + '/resources/' + str + '/' + e.number + '.png'}" />
        <span>Species: ${findName(e.number, pokemonArr)}</span>
        <span>Rate: ${Math.round(e.rate * modifier * 100)/100}%</span>
      </div>
    `;
  });
  tempHTML += `<div class="encounterRate">${arr.length === 200 ? "" : Math.round(encounterRate * 10000)/100 + '%'} Encounter Rate</div>`
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
      smooshedArr.push({"number": e.number, "rate": Number(e.rate)});
    }
  });
  smooshedArr.sort((a,b) => b.rate - a.rate);
  return smooshedArr;
};

//input of repels
const RepelSection = (props) => {

  const [repelLevel, setRepelLevel] = useState();

  //takes an array of encounters and repels out lower levels
  const processRepels = (arr, num) => {
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
    const game = document.getElementById("games").value;
    if(repelInput){
      const exemptGames = ["emerald", "diamond", "pearl", "platinum", "heartgold", "soulsilver", "black", "black2", "white", "white2"];
      if(!(exemptGames.includes(game))){
        repelInput.disabled = props.intimidateActive;
      } else {
        repelInput.disabled = false;
      }
    }
  }, [props.intimidateActive]);

  if (props.repel){
    return(
      <div id="repelArea">
        Repel Level: <input 
          id="repelLevelInput" 
          type='number' 
          value={repelLevel} 
          onChange={handleChange} 
          onKeyDown={(evt) => ["e", "E", "+", "-", "."].includes(evt.key) && evt.preventDefault()}
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
    props.setEncounters(props.encounters);
    props.setTodIndex(1);
  }, [props.encounters]);

  if (props.tod){
    return (
      <div id="todArea">
        <span>Time of Day:</span>
        <select id="todInput" onChange={handleChange}>
          <option value="0">Morning</option>
          <option value="1" selected>Day</option>
          <option value="2">Night</option>
        </select>
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
      <div id="gscSwarmArea">
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
      <div id="rseSwarmArea">
        <span>Swarm?</span>
        <select id="rseSwarmSelect" onChange={handleChange} dangerouslySetInnerHTML={{__html: rseSwarmHTML}}>
        </select>
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
      const URarray = ["201-a", "201-b", "201-c", "201-d", "201-e", "201-f", "201-g", "201-h", "201-i", "201-j", "201-k"];
      const LLarray = ["201-l", "201-m", "201-n", "201-o", "201-p", "201-q", "201-r"];
      const LRarray = ["201-s", "201-t", "201-u", "201-v", "201-w"];
      const ULarray = ["201-x", "201-y", "201-z"];

      const tempArray = [];

      const pushUnownForms = (arr, tempArray) => {
        arr.forEach((e) => {
          tempArray.push(
            {
              "number": e,
              "minLevel": 5,
              "rate": e === "201-z" ? "0.0234375" : "0.0390625"
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
    } else{
      props.setEncounters(props.encounters);
    }
  }, [props.encounters]);

  if (props.gscRuins){
    return(
      <div id="gscRuinsArea">
        <fieldset onChange={handleChange}>
          <legend>Select completed puzzles</legend>
          <label for="upper-right">Upper Right</label>
          <input type="checkbox" id="upper-right"/>
          <br/>
          <label for="lower-left">Lower Left</label>
          <input type="checkbox" id="lower-left"/>
          <br/>
          <label for="lower-right">Lower Right</label>
          <input type="checkbox" id="lower-right"/>
          <br/>
          <label for="upper-left">Upper Left</label>
          <input type="checkbox" id="upper-left"/>
        </fieldset>
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
      for (const element of props.pokemonArr){
        if (element.number === e.number){
          if(element.type1 === type || element.type2 === type){
            foundType.push(JSON.parse(JSON.stringify(e)));
          }
          break;
        }
      };
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

  const handleChange = () => {
    props.setIntimidateActive(false);
    const leadLevelInput = document.getElementById("leadLevelInput");
    leadLevelInput.disabled = true;
    const dropdown = document.getElementById("abilitySelect");
    if(dropdown && dropdown.value !== "none"){
      const game = document.getElementById("games").value;
      //sword and shield handle abilities differently
      if (game !== "sword" && game !== "shield"){
        switch (dropdown.value){
          case "static":
            props.setEncounters(typeModAbility("electric", 0.5));
            break;
          case "magnet pull":
            props.setEncounters(typeModAbility("steel", 0.5));
            break;
          case "keen eye/intimidate":
            leadLevelInput.disabled = false;
            props.setEncounters(intimidateAbility(leadLevel));
            props.setIntimidateActive(true);
            break;
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
      <div id="abilityArea">
        <span>Ability?</span>
        <select id="abilitySelect" onChange={handleChange} dangerouslySetInnerHTML={{__html: abilityHTML}}>
        </select>
        <div>
          Lead Level: <input 
            id="leadLevelInput" 
            type='number' 
            value={leadLevel} 
            onChange={handleLevelChange} 
            onKeyDown={(evt) => ["e", "E", "+", "-", "."].includes(evt.key) && evt.preventDefault()}
            disabled
          />
        </div>
      </div>
    )
  }
};

const App = () => {

  //State variables for program
  //Data pulled from JSONs. Pokemon Data is every pokemon's data
  //Encounter Data is complete data of the selected game
  const [encounterData, setEncounterData] = useState({});
  const [pokemonData, setPokemonData] = useState({});
  //The area in the game that is being encountered
  const [selectedArea, setSelectedArea] = useState("");
  //The arrays of encounters
  const [encounters, setEncouters] = useState([]); //The raw encounter data
  const [todEncounters, setTodEncounters] = useState([]);//encounters modified by time of day
  const [gscSwarmEncounters, setGscSwarmEncounters] = useState([]);//encounters modified by swarms in Gold, Silver, and Crystal
  const [rseSwarmEncounters, setRseSwarmEncounters] = useState([]);//encounters modified by swarms in Ruby, Sapphire, and Emerald
  const [gscRuinsEncounters, setGscRuinsEncounters] = useState([]); //encounters modified in the Ruins of Alph
  const [abilityEncounters, setAbilityEncounters] = useState([]);//encounters modified by abilities such as static
  const [repelEncounters, setRepelEncounters] = useState([]); //encounters modified by repels
  //variables that come with the encounters such as if a repel can be used
  const [variables, setVariables] = useState({});
  //variables created by user inputs that have to be passed between componenents
  const [todIndex, setTodIndex] = useState(1);
  const [intimidateActive, setIntimidateActive] = useState(false);
  //sprite extension based on game
  const [spriteExtension, setSpriteExtension] = useState('');
  //whether to use game specific sprites or just 3d models
  const [useModels, setUseModels] = useState(false);

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
      areasElement.innerHTML = areasHTML;
      areasElement.disabled = false;
    } catch {
      alert("problem collecting encounter data");
    }
  };

  //on load
  useEffect(() => {
    fetchPokemonData();
  }, []);

  //reset everything
  const clearEncounters = () => {
    setEncouters([]);
    setVariables({});
  };

  //which game has been selected has changed
  const handleGameChange = (event) => {
    fetchEncounterData(event.target.value);
    clearEncounters();
    if (useModels){
      setSpriteExtension("gen6");
    } else {
      switch (event.target.value){
        case "red":
        case "blue - INT":
        case "blue - JPN":
          setSpriteExtension("gen1/rb");
          break;
        case "yellow":
          setSpriteExtension("gen1/yellow");
          break;
        case "gold":
        case "gold - JPN":
          setSpriteExtension("gen2/gold");
          break;
        case "silver":
        case "silver - JPN":
          setSpriteExtension("gen2/silver");
          break;
        case "crystal":
          setSpriteExtension("gen2/crystal");
          break;
        case "ruby":
        case "sapphire":
          setSpriteExtension("gen3/rs");
          break;
        case "emerald":
          setSpriteExtension("gen3/emerald");
          break;
        case "firered":
        case "leafgreen":
          setSpriteExtension("gen3/frlg");
          break;
        default:
          setSpriteExtension("gen6");
      }
    }
    const methodElement = document.getElementById("methods");
    methodElement.innerHTML = `<option value="" selected disabled hidden>Choose Area First</option>`;
    methodElement.disabled = true;
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
    methodElement.innerHTML = methodsHTML;
    methodElement.disabled = false;
  };

  //which method of encounters has changed (walking, surfing, fishing, etc.)
  const handleMethodChange = (event) => {
    let tempArray = Object.values(encounterData[selectedArea][event.target.value]);
    clearEncounters();
    setVariables(Object.keys(encounterData[selectedArea][event.target.value])[tempArray.length - 1] === "variables" ? tempArray.pop() : {});
    setEncouters(tempArray);
  };

  return(
    <div>
      <h2>Game and Area:</h2>
      <div id="selections">
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
        </select>
        <select id="areas" onChange={handleAreaChange} disabled>
          <option value="" selected disabled hidden>Choose Game First</option>
        </select>
        <select id="methods" onChange={handleMethodChange} disabled>
          <option value="" selected disabled hidden>Choose Area First</option>
        </select>
      </div>
      <div id="encounterSlots" dangerouslySetInnerHTML={encounterHTMLGenerator(gscRuinsEncounters, spriteExtension, pokemonData)}></div>
      <TimeOfDaySection tod={variables.tod} setTodIndex={setTodIndex} encounters={encounters} setEncounters={setTodEncounters}/>
      <GscSwarmSection gscSwarm={variables.gscSwarm} todIndex={todIndex} encounters={todEncounters} setEncounters={setGscSwarmEncounters}/>
      <RseSwarmSection rseSwarm={variables.rseSwarm} encounters={gscSwarmEncounters} setEncounters={setRseSwarmEncounters}/>
      <GscRuinsSection gscRuins={variables.gscRuins} encounters={rseSwarmEncounters} setEncounters={setGscRuinsEncounters}/>
      <AbilitySection ability={variables.ability} encounters={gscRuinsEncounters} setEncounters={setAbilityEncounters} pokemonArr={pokemonData} setIntimidateActive={setIntimidateActive}/>
      <RepelSection repel={variables.repel} primeEncounters={encounters} encounters={abilityEncounters} setEncounters={setRepelEncounters} intimidateActive={intimidateActive}/>
      <div id="processedEncounters"
        dangerouslySetInnerHTML={
          encounters.length === 0 ? 
          {__html: ""} : 
          processedEncountersHTMLGenerator(condenseEncounters(repelEncounters), spriteExtension, pokemonData)
        }
      >
      </div>
    </div>
  )
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div>
    <App/>
  </div>
);