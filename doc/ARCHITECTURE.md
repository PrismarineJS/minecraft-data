## minecraft-data architecture
Key Details:
* Langauge independent repository holding data for many Minecraft versions, including Java Edition versions after 1.7 and Bedrock Edition versions after 1.16
* Has data on blocks, items, network protocol packet structures, entities and more
* The data in this repo is generated using several tools as described in the `doc/add-data-new-version.md` file for Java Edition and `doc/bedrock.md` for Bedrock Edition

File Structure:
* Most data is stored in JSON. The JSON schemas for these files are stored inside the `schemas/` folder.
* `data/pc` contains data for minecraft java edition separated by folder and `data/bedrock` for bedrock edition
* `data/dataPaths.json` has a mapping for minecraft version to data type to folder to find that data.
  * It looks like `{"pc": { "1.16": {"blocks":"pc/1.16"} } }`, meaning java edition block data for version 1.16 can be found in `pc/1.16` under the name `blocks.json`. If the data didn't change from 1.15, it might point to `pc/1.15` instead.
* `tools/js` contains Node.js scripts to do maintenance on the repository, such as running tests to ensure data validity and also contains some files used to generate data inside the repository.

Usage:
* As documented in the README.md, there exist several wrappers that expose the data inside minecraft-data. Notably, this includes PrismarineJS/node-minecraft-data, which exposes the data as a NPM package. 

Contributing Tips:
* Files should generally be obtained with the use of a data extractor or generator, as mentioned above
* If you make a PR with new data, describe how you obtained the data, as otherwise we won't be able to obtain that data for future versions
* Checkout the `.github/workflows` directory to see how tests are run on the repo
