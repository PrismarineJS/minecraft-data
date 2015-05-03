var WikiTextParser = require('./../lib/wikitext_parser');
var _ = require('underscore');


var wikiTextParser = new WikiTextParser();

var testInput = "text_abstract\n" +
  "= premiere =\n" +
  "blabla\n" +
  "== deuxieme ==\n" +
  "text\n" +
  "== troisieme ==\n" +
  "text2\n" +
  "= quatrieme =\n" +
  "text3\n";

var testOutput = {
  "content": ["text_abstract"],
  "premiere": {
    "content":["blabla"],
    "deuxieme": {
      "content": ["text"]
    },
    "troisieme": {
      "content": ["text2"]
    }
  },
  "quatrieme": {
    "content":["text3",""]
  }
};

var testInput2 = "text_abstract\n" +
  "= premiere =\n" +
  "blabla\n" +
  "=== deuxieme ===\n" +
  "text\n" +
  "=== troisieme ===\n" +
  "text2\n" +
  "= quatrieme =\n" +
  "text3\n";

var testOutput2 = {
  "content": ["text_abstract"],
  "premiere": {
    "content":["blabla"],
    "deuxieme": {
      "content": ["text"]
    },
    "troisieme": {
      "content": ["text2"]
    }
  },
  "quatrieme": {
    "content":["text3",""]
  }
};

var testInput3 = "text_abstract\n" +
  "= premiere =\n" +
  "blabla\n" +
  "=== deuxieme ===\n" +
  "text\n" +
  "=== troisieme ===\n" +
  "text7\n" +
  "=== 6666 ===\n" +
  "text2\n" +
  "= quatrieme =\n" +
  "text3\n";

var testOutput3 = {
  "content": ["text_abstract"],
  "premiere": {
    "content":["blabla"],
    "deuxieme": {
      "content": ["text"]
    },
    "troisieme": {
      "content": ["text7"]
    },
    "6666": {
      "content": ["text2"]
    }
  },
  "quatrieme": {
    "content":["text3",""]
  }
};

function test(input, expectedOutput) {
  var actualOutput = wikiTextParser.pageToSectionObject(input);
  if(_.isEqual(actualOutput,expectedOutput))
  {
    return true;
  }
  else
  {
    console.log("actual output :");
    console.log(JSON.stringify(actualOutput));
    console.log("expected output :");
    console.log(JSON.stringify(expectedOutput));
    return false;
  }
}

//test(testInput, testOutput);
//test(testInput2, testOutput2);
//test(testInput3, testOutput3);

// {{BlockSprite|id
function testSlab() {
  wikiTextParser.getArticle("Slab", function (err, data) {
    var sectionObject = wikiTextParser.pageToSectionObject(data);

    console.log(sectionObject["content"]);
    var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values = infoBox["values"];
    console.log(values);
  });
}

testSlab();