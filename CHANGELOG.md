# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.7.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.4.0...v2.7.0) (2026-04-17)


### ⚠ BREAKING CHANGES

* **rims:** None - All changes are additive

Closes #RIMS-implementation

### ⏪ Reverts

* remove atomic mash on/off, restore valve/pump service calls ([0f4c381](https://github.com/BrewnodeDave/brewnode-server/commit/0f4c3817c54e2e148a7be3f1ac5fbc7d8d3ffe23))


### ✨ Features

* add debug cli option ([65fe3fc](https://github.com/BrewnodeDave/brewnode-server/commit/65fe3fcd7a9cfd5477ff7853bdce3d07f351f3a5))
* added pump modulation ([29a7fb3](https://github.com/BrewnodeDave/brewnode-server/commit/29a7fb35b238edb623efa8f316780a683ab64b3e))
* new mash temp sensor ([8b42f8e](https://github.com/BrewnodeDave/brewnode-server/commit/8b42f8ed95df1211c9cf069071dace31329af78d))
* recirc improvements ([e3f7eff](https://github.com/BrewnodeDave/brewnode-server/commit/e3f7eff1624c405ee08e572c7098e4e45a4b3d49))
* recirculate at specific temp ([845cc7b](https://github.com/BrewnodeDave/brewnode-server/commit/845cc7b32efd2e6d7a2fbf9d8d6af586ec73b2a5))
* recirculate mash steps ([7ed1a11](https://github.com/BrewnodeDave/brewnode-server/commit/7ed1a11383fe724fa6eb4deb26aa299a3cd255e3))
* repeat commands to valves ([60925e1](https://github.com/BrewnodeDave/brewnode-server/commit/60925e1c931f332261b58f9dce8ef33d85bb408d))
* **rims:** add complete RIMS recirculation system with PID control ([e25bc9c](https://github.com/BrewnodeDave/brewnode-server/commit/e25bc9c117c2ec7616259eede5058e5547379dd4))
* send email alert on every error/critical log via email-service ([517ec90](https://github.com/BrewnodeDave/brewnode-server/commit/517ec90a2ba780f3bb99ca25ddcdecf99cda4fbc))
* simplify recirc ([08d8405](https://github.com/BrewnodeDave/brewnode-server/commit/08d84051d82763c7f72bcba5309abfa26439ae6d))
* start from any dir ([e09f4f8](https://github.com/BrewnodeDave/brewnode-server/commit/e09f4f882f77001b111bbb20c113322ff212b06b))
* unqualify valve openings ([810f8e9](https://github.com/BrewnodeDave/brewnode-server/commit/810f8e90b48b7c30da20901214649904527d8cb7))


### 🐛 Bug Fixes

* . ([8b6c7b7](https://github.com/BrewnodeDave/brewnode-server/commit/8b6c7b74768dd40bba1d4c67fdb15e6baa6e7e82))
* add mod time to recirc ([386dd9e](https://github.com/BrewnodeDave/brewnode-server/commit/386dd9eb6633e09e245986686fd2d88f0c13c418))
* added mashtun to heat loss calc ([a56e8ba](https://github.com/BrewnodeDave/brewnode-server/commit/a56e8bacf6a85a108376dde5d684d08fd9f06fe2))
* blah ([bb3c94a](https://github.com/BrewnodeDave/brewnode-server/commit/bb3c94a5b970abd6a7f3a5586d835a26d877f5d1))
* call raspi.init() before new I2C() — peripheral not alive otherwise ([7744122](https://github.com/BrewnodeDave/brewnode-server/commit/77441222ee06792d4410e35593fe8273ec48c382))
* correct delay.test.js to match actual delay.js API ([181b061](https://github.com/BrewnodeDave/brewnode-server/commit/181b061044fab66ecc211c256cc0cde5d2cad088))
* debug ([a83b839](https://github.com/BrewnodeDave/brewnode-server/commit/a83b839c9b38e23b0ac36a99203bfb18dcf62587))
* debug ([5af29a4](https://github.com/BrewnodeDave/brewnode-server/commit/5af29a4b4b5d5691a4aac67da6c0ebeed41b1851))
* delay pump start 500ms after valve open to allow solenoid to open ([74b31c3](https://github.com/BrewnodeDave/brewnode-server/commit/74b31c3c8cfcc9ec972585ec07706bb40b01e106))
* downgrade ENOTFOUND to warn and catch network errors in getFermenterTemp ([3d3ee77](https://github.com/BrewnodeDave/brewnode-server/commit/3d3ee77bfca99d19dcc2e3b570af2220288c2610))
* manage all recirc timers ([80355a5](https://github.com/BrewnodeDave/brewnode-server/commit/80355a52a2dbce03c8f7521b0ad6e500b4741a7a))
* mash recirc ([60b04b8](https://github.com/BrewnodeDave/brewnode-server/commit/60b04b8c85e444ecd396c473df8438df119c8ad0))
* mash recirc ([ce85d3d](https://github.com/BrewnodeDave/brewnode-server/commit/ce85d3dc3c625f6d17a8cc5ba4a17eba8082c8f8))
* mash recirc ([af7226e](https://github.com/BrewnodeDave/brewnode-server/commit/af7226ee9a3c37861c1524571cfed9ebe19fb1c8))
* mash steps ([17f7677](https://github.com/BrewnodeDave/brewnode-server/commit/17f7677464e6be84e68cbafc58cb93ea2af4cd8b))
* mash valve sync ([b1a9f41](https://github.com/BrewnodeDave/brewnode-server/commit/b1a9f4138050c266ec9a3dfbb37429e67c07f3aa))
* mash valve sync ([9051d47](https://github.com/BrewnodeDave/brewnode-server/commit/9051d47a3a793fe64b3a6e670f84791b3a2d4790))
* mash valve sync ([c029b3e](https://github.com/BrewnodeDave/brewnode-server/commit/c029b3eda127809b161b9877a7ff848d366d0b27))
* mashe valve opening ([577a3b7](https://github.com/BrewnodeDave/brewnode-server/commit/577a3b7b29a487f8aca24f4006ccb15de601ca9b))
* mashe valve opening ([4216089](https://github.com/BrewnodeDave/brewnode-server/commit/421608905503cefd6e476f74398c504478084d71))
* mashe valve opening ([1c1153d](https://github.com/BrewnodeDave/brewnode-server/commit/1c1153dbe645b9578dbec087eca299e6cda5ab9b))
* mashe valve opening ([30214ce](https://github.com/BrewnodeDave/brewnode-server/commit/30214ce9993e72e408cb6ff29cdd487a0eb1f827))
* mashe valve opening ([54be5bd](https://github.com/BrewnodeDave/brewnode-server/commit/54be5bdb63eeae46fa751f563cfefa9b86975e5c))
* memory leaks — broker listener accumulation, stale sockets, double unSubscribe ([5f8f963](https://github.com/BrewnodeDave/brewnode-server/commit/5f8f96330d83782af5922745299c90cfce2712f9))
* merge conflict ([4064bc0](https://github.com/BrewnodeDave/brewnode-server/commit/4064bc0757f6422bbbec1ddad753c9b104794034))
* pipeHeatLoss retries sensor up to 10x (500ms apart) instead of falling back to 20C ([33bb3df](https://github.com/BrewnodeDave/brewnode-server/commit/33bb3df252f19b3b13117c5c2dac02f449ca90d7))
* pipeHeatLoss returns NaN when mash sensor is null — fallback to 20C ambient ([79f4601](https://github.com/BrewnodeDave/brewnode-server/commit/79f460136b878cb767ada75c2c873e737e74ddab))
* pipeHeatLoss used conduction formula instead of convective — caused ~46°C strike temp offset ([ce4a28e](https://github.com/BrewnodeDave/brewnode-server/commit/ce4a28eabe3b64b0c352deedfdd066e3915dadfe))
* prevent blank temperature posts to Brewfather when sensors are null ([47b609b](https://github.com/BrewnodeDave/brewnode-server/commit/47b609bf77da39765db02ee013b2bf45fb4cc8b2))
* prevent raspi.init() timeout when i2c.start() called multiple times ([c903043](https://github.com/BrewnodeDave/brewnode-server/commit/c903043826d6deac94f4610e2ba736e6147286fc))
* pumnp management during temp readings ([e7932c7](https://github.com/BrewnodeDave/brewnode-server/commit/e7932c712c2cc671738c590575dc63a40f7549f1))
* read OLAT register for writeReg verify instead of GPIO register ([bb96740](https://github.com/BrewnodeDave/brewnode-server/commit/bb96740265ed1dfce365a0f0bf77c7c05e5df2ce))
* recirc ([6787201](https://github.com/BrewnodeDave/brewnode-server/commit/6787201ed2d330f249d13c57636aafd481f87f0d))
* recirc ([f54d295](https://github.com/BrewnodeDave/brewnode-server/commit/f54d2958b96d667e9e7c72aadb1baf0e6f341aab))
* recirc mash step ([f30761f](https://github.com/BrewnodeDave/brewnode-server/commit/f30761fb3839d7d9b3898c3485f215e3f52de263))
* recirc pid ([ee7c2a9](https://github.com/BrewnodeDave/brewnode-server/commit/ee7c2a9760553d7ffbfbb46393fe9873b03aee54))
* recirc valve/pump timing ([ed206c6](https://github.com/BrewnodeDave/brewnode-server/commit/ed206c6cfeca0fd0b69fb6c7e44db1e0d2f7d07c))
* remove some warnings  - spam ([eb0d8f2](https://github.com/BrewnodeDave/brewnode-server/commit/eb0d8f26a910f9ae723e97e80b982949455c3098))
* repeatedly send open pulse ([b1c1b36](https://github.com/BrewnodeDave/brewnode-server/commit/b1c1b368359462fede0165a363d71ce7af3ad66d))
* repeatedly send open pulse ([db083c1](https://github.com/BrewnodeDave/brewnode-server/commit/db083c1c9fe6127ba77bedebba0c11e732360758))
* repeatedly send open pulse ([5c40032](https://github.com/BrewnodeDave/brewnode-server/commit/5c40032d8fd44f81d80432a9d28ca024d5bb149b))
* retry I2C writes ([4904774](https://github.com/BrewnodeDave/brewnode-server/commit/49047741b17dffc485a6399ee8c3055f8e64770a))
* retry temp readings ([21fa9a2](https://github.com/BrewnodeDave/brewnode-server/commit/21fa9a225e7b5f5b8fde4f8eecf3c073d881333f))
* sync recirc pumps ([9213315](https://github.com/BrewnodeDave/brewnode-server/commit/92133158185f1b296e1509dcb90482698d8624be))
* temp ([cd7f2d0](https://github.com/BrewnodeDave/brewnode-server/commit/cd7f2d0c6554c0814aeed6b55bdbcb19341c8314))
* temp vershoot and valve problem ([ed2c517](https://github.com/BrewnodeDave/brewnode-server/commit/ed2c517e679f236e776cd08ca20cafd78772b372))
* time mash step at temp ([3256189](https://github.com/BrewnodeDave/brewnode-server/commit/325618905572c70d3ef9e52e0e2e00101184ca52))
* time mash step at temp ([c08a904](https://github.com/BrewnodeDave/brewnode-server/commit/c08a9040f1e89fa34593a141a75c7b3138c79db1))
* trialling a AI fix to retries ([aded40c](https://github.com/BrewnodeDave/brewnode-server/commit/aded40c9428b85c9748797fc73361724e376d50b))
* trialling a AI fix to retries ([9909850](https://github.com/BrewnodeDave/brewnode-server/commit/99098508aba89eb33def4fb6bd826e47bb70d0c8))
* trialling a AI fix to retries ([e85b65c](https://github.com/BrewnodeDave/brewnode-server/commit/e85b65cc764ac8711c9eaec1b340a74ecc77156d))
* trialling a AI fix to retries ([ce7cf7c](https://github.com/BrewnodeDave/brewnode-server/commit/ce7cf7c6ded8e306ef7b57aa5897956c7d6f3c1d))
* typo brewlog.critcal -> brewlog.critical causes silent process.exit on startup ([32c0180](https://github.com/BrewnodeDave/brewnode-server/commit/32c0180bdc63edc174986682610fb6c5cceabeec))
* use mash temp for recirc ([34e1a21](https://github.com/BrewnodeDave/brewnode-server/commit/34e1a21d9026147fb6eb6bc1326d61f7cb0dc196))
* use socket parameter not _socket module var in disconnect handler ([c0a4d57](https://github.com/BrewnodeDave/brewnode-server/commit/c0a4d5706261f69e73e706e75f02f0c2a683b1f7))
* wrap raspi.init() with 8s timeout to prevent beforeAll hang ([6105a8f](https://github.com/BrewnodeDave/brewnode-server/commit/6105a8f7c6de2cdde93137e5cd671d6ae5810b4e))
* xxxx ([01fabc8](https://github.com/BrewnodeDave/brewnode-server/commit/01fabc895c16db924d1745cbdfad4f59a7389b12))
* xxxx ([cd124ad](https://github.com/BrewnodeDave/brewnode-server/commit/cd124adc840906eda3d80be3c330fd91f8ac2d3c))


### 🔧 Maintenance

* debug time pump and valves ([e64f35e](https://github.com/BrewnodeDave/brewnode-server/commit/e64f35ee4f1de3045ceb47314669e8557613016f))
* open/close mash in valve when modulting kettle pump ([429ea74](https://github.com/BrewnodeDave/brewnode-server/commit/429ea745cd49f97036000a5a1204513883813711))
* **release:** 2.5.0 ([67f40cb](https://github.com/BrewnodeDave/brewnode-server/commit/67f40cb4f3eb6d57a41e760bfd2a1e70562b99a4))
* restore removed validatePiHardware call as commented-out code ([51311dd](https://github.com/BrewnodeDave/brewnode-server/commit/51311dd5d8ef52fb430fc4d8dd0949eae1fd02f5))
* update GitHub Actions workflow for npm publishing ([7d56f7f](https://github.com/BrewnodeDave/brewnode-server/commit/7d56f7f31e1215f44ed6bd75df97128ab70996ac))

## [2.5.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.4.0...v2.5.0) (2026-04-17)


### ⚠ BREAKING CHANGES

* **rims:** None - All changes are additive

Closes #RIMS-implementation

### ⏪ Reverts

* remove atomic mash on/off, restore valve/pump service calls ([0f4c381](https://github.com/BrewnodeDave/brewnode-server/commit/0f4c3817c54e2e148a7be3f1ac5fbc7d8d3ffe23))


### ✨ Features

* add debug cli option ([65fe3fc](https://github.com/BrewnodeDave/brewnode-server/commit/65fe3fcd7a9cfd5477ff7853bdce3d07f351f3a5))
* added pump modulation ([29a7fb3](https://github.com/BrewnodeDave/brewnode-server/commit/29a7fb35b238edb623efa8f316780a683ab64b3e))
* new mash temp sensor ([8b42f8e](https://github.com/BrewnodeDave/brewnode-server/commit/8b42f8ed95df1211c9cf069071dace31329af78d))
* recirc improvements ([e3f7eff](https://github.com/BrewnodeDave/brewnode-server/commit/e3f7eff1624c405ee08e572c7098e4e45a4b3d49))
* recirculate at specific temp ([845cc7b](https://github.com/BrewnodeDave/brewnode-server/commit/845cc7b32efd2e6d7a2fbf9d8d6af586ec73b2a5))
* recirculate mash steps ([7ed1a11](https://github.com/BrewnodeDave/brewnode-server/commit/7ed1a11383fe724fa6eb4deb26aa299a3cd255e3))
* repeat commands to valves ([60925e1](https://github.com/BrewnodeDave/brewnode-server/commit/60925e1c931f332261b58f9dce8ef33d85bb408d))
* **rims:** add complete RIMS recirculation system with PID control ([e25bc9c](https://github.com/BrewnodeDave/brewnode-server/commit/e25bc9c117c2ec7616259eede5058e5547379dd4))
* send email alert on every error/critical log via email-service ([517ec90](https://github.com/BrewnodeDave/brewnode-server/commit/517ec90a2ba780f3bb99ca25ddcdecf99cda4fbc))
* simplify recirc ([08d8405](https://github.com/BrewnodeDave/brewnode-server/commit/08d84051d82763c7f72bcba5309abfa26439ae6d))
* start from any dir ([e09f4f8](https://github.com/BrewnodeDave/brewnode-server/commit/e09f4f882f77001b111bbb20c113322ff212b06b))
* unqualify valve openings ([810f8e9](https://github.com/BrewnodeDave/brewnode-server/commit/810f8e90b48b7c30da20901214649904527d8cb7))


### 🔧 Maintenance

* debug time pump and valves ([e64f35e](https://github.com/BrewnodeDave/brewnode-server/commit/e64f35ee4f1de3045ceb47314669e8557613016f))
* open/close mash in valve when modulting kettle pump ([429ea74](https://github.com/BrewnodeDave/brewnode-server/commit/429ea745cd49f97036000a5a1204513883813711))
* restore removed validatePiHardware call as commented-out code ([51311dd](https://github.com/BrewnodeDave/brewnode-server/commit/51311dd5d8ef52fb430fc4d8dd0949eae1fd02f5))
* update GitHub Actions workflow for npm publishing ([7d56f7f](https://github.com/BrewnodeDave/brewnode-server/commit/7d56f7f31e1215f44ed6bd75df97128ab70996ac))


### 🐛 Bug Fixes

* . ([8b6c7b7](https://github.com/BrewnodeDave/brewnode-server/commit/8b6c7b74768dd40bba1d4c67fdb15e6baa6e7e82))
* add mod time to recirc ([386dd9e](https://github.com/BrewnodeDave/brewnode-server/commit/386dd9eb6633e09e245986686fd2d88f0c13c418))
* added mashtun to heat loss calc ([a56e8ba](https://github.com/BrewnodeDave/brewnode-server/commit/a56e8bacf6a85a108376dde5d684d08fd9f06fe2))
* blah ([bb3c94a](https://github.com/BrewnodeDave/brewnode-server/commit/bb3c94a5b970abd6a7f3a5586d835a26d877f5d1))
* call raspi.init() before new I2C() — peripheral not alive otherwise ([7744122](https://github.com/BrewnodeDave/brewnode-server/commit/77441222ee06792d4410e35593fe8273ec48c382))
* correct delay.test.js to match actual delay.js API ([181b061](https://github.com/BrewnodeDave/brewnode-server/commit/181b061044fab66ecc211c256cc0cde5d2cad088))
* debug ([a83b839](https://github.com/BrewnodeDave/brewnode-server/commit/a83b839c9b38e23b0ac36a99203bfb18dcf62587))
* debug ([5af29a4](https://github.com/BrewnodeDave/brewnode-server/commit/5af29a4b4b5d5691a4aac67da6c0ebeed41b1851))
* delay pump start 500ms after valve open to allow solenoid to open ([74b31c3](https://github.com/BrewnodeDave/brewnode-server/commit/74b31c3c8cfcc9ec972585ec07706bb40b01e106))
* downgrade ENOTFOUND to warn and catch network errors in getFermenterTemp ([3d3ee77](https://github.com/BrewnodeDave/brewnode-server/commit/3d3ee77bfca99d19dcc2e3b570af2220288c2610))
* manage all recirc timers ([80355a5](https://github.com/BrewnodeDave/brewnode-server/commit/80355a52a2dbce03c8f7521b0ad6e500b4741a7a))
* mash recirc ([60b04b8](https://github.com/BrewnodeDave/brewnode-server/commit/60b04b8c85e444ecd396c473df8438df119c8ad0))
* mash recirc ([ce85d3d](https://github.com/BrewnodeDave/brewnode-server/commit/ce85d3dc3c625f6d17a8cc5ba4a17eba8082c8f8))
* mash recirc ([af7226e](https://github.com/BrewnodeDave/brewnode-server/commit/af7226ee9a3c37861c1524571cfed9ebe19fb1c8))
* mash steps ([17f7677](https://github.com/BrewnodeDave/brewnode-server/commit/17f7677464e6be84e68cbafc58cb93ea2af4cd8b))
* mash valve sync ([b1a9f41](https://github.com/BrewnodeDave/brewnode-server/commit/b1a9f4138050c266ec9a3dfbb37429e67c07f3aa))
* mash valve sync ([9051d47](https://github.com/BrewnodeDave/brewnode-server/commit/9051d47a3a793fe64b3a6e670f84791b3a2d4790))
* mash valve sync ([c029b3e](https://github.com/BrewnodeDave/brewnode-server/commit/c029b3eda127809b161b9877a7ff848d366d0b27))
* mashe valve opening ([577a3b7](https://github.com/BrewnodeDave/brewnode-server/commit/577a3b7b29a487f8aca24f4006ccb15de601ca9b))
* mashe valve opening ([4216089](https://github.com/BrewnodeDave/brewnode-server/commit/421608905503cefd6e476f74398c504478084d71))
* mashe valve opening ([1c1153d](https://github.com/BrewnodeDave/brewnode-server/commit/1c1153dbe645b9578dbec087eca299e6cda5ab9b))
* mashe valve opening ([30214ce](https://github.com/BrewnodeDave/brewnode-server/commit/30214ce9993e72e408cb6ff29cdd487a0eb1f827))
* mashe valve opening ([54be5bd](https://github.com/BrewnodeDave/brewnode-server/commit/54be5bdb63eeae46fa751f563cfefa9b86975e5c))
* memory leaks — broker listener accumulation, stale sockets, double unSubscribe ([5f8f963](https://github.com/BrewnodeDave/brewnode-server/commit/5f8f96330d83782af5922745299c90cfce2712f9))
* merge conflict ([4064bc0](https://github.com/BrewnodeDave/brewnode-server/commit/4064bc0757f6422bbbec1ddad753c9b104794034))
* pipeHeatLoss retries sensor up to 10x (500ms apart) instead of falling back to 20C ([33bb3df](https://github.com/BrewnodeDave/brewnode-server/commit/33bb3df252f19b3b13117c5c2dac02f449ca90d7))
* pipeHeatLoss returns NaN when mash sensor is null — fallback to 20C ambient ([79f4601](https://github.com/BrewnodeDave/brewnode-server/commit/79f460136b878cb767ada75c2c873e737e74ddab))
* pipeHeatLoss used conduction formula instead of convective — caused ~46°C strike temp offset ([ce4a28e](https://github.com/BrewnodeDave/brewnode-server/commit/ce4a28eabe3b64b0c352deedfdd066e3915dadfe))
* prevent blank temperature posts to Brewfather when sensors are null ([47b609b](https://github.com/BrewnodeDave/brewnode-server/commit/47b609bf77da39765db02ee013b2bf45fb4cc8b2))
* prevent raspi.init() timeout when i2c.start() called multiple times ([c903043](https://github.com/BrewnodeDave/brewnode-server/commit/c903043826d6deac94f4610e2ba736e6147286fc))
* pumnp management during temp readings ([e7932c7](https://github.com/BrewnodeDave/brewnode-server/commit/e7932c712c2cc671738c590575dc63a40f7549f1))
* read OLAT register for writeReg verify instead of GPIO register ([bb96740](https://github.com/BrewnodeDave/brewnode-server/commit/bb96740265ed1dfce365a0f0bf77c7c05e5df2ce))
* recirc ([6787201](https://github.com/BrewnodeDave/brewnode-server/commit/6787201ed2d330f249d13c57636aafd481f87f0d))
* recirc ([f54d295](https://github.com/BrewnodeDave/brewnode-server/commit/f54d2958b96d667e9e7c72aadb1baf0e6f341aab))
* recirc mash step ([f30761f](https://github.com/BrewnodeDave/brewnode-server/commit/f30761fb3839d7d9b3898c3485f215e3f52de263))
* recirc pid ([ee7c2a9](https://github.com/BrewnodeDave/brewnode-server/commit/ee7c2a9760553d7ffbfbb46393fe9873b03aee54))
* recirc valve/pump timing ([ed206c6](https://github.com/BrewnodeDave/brewnode-server/commit/ed206c6cfeca0fd0b69fb6c7e44db1e0d2f7d07c))
* remove some warnings  - spam ([eb0d8f2](https://github.com/BrewnodeDave/brewnode-server/commit/eb0d8f26a910f9ae723e97e80b982949455c3098))
* repeatedly send open pulse ([b1c1b36](https://github.com/BrewnodeDave/brewnode-server/commit/b1c1b368359462fede0165a363d71ce7af3ad66d))
* repeatedly send open pulse ([db083c1](https://github.com/BrewnodeDave/brewnode-server/commit/db083c1c9fe6127ba77bedebba0c11e732360758))
* repeatedly send open pulse ([5c40032](https://github.com/BrewnodeDave/brewnode-server/commit/5c40032d8fd44f81d80432a9d28ca024d5bb149b))
* retry I2C writes ([4904774](https://github.com/BrewnodeDave/brewnode-server/commit/49047741b17dffc485a6399ee8c3055f8e64770a))
* retry temp readings ([21fa9a2](https://github.com/BrewnodeDave/brewnode-server/commit/21fa9a225e7b5f5b8fde4f8eecf3c073d881333f))
* sync recirc pumps ([9213315](https://github.com/BrewnodeDave/brewnode-server/commit/92133158185f1b296e1509dcb90482698d8624be))
* temp ([cd7f2d0](https://github.com/BrewnodeDave/brewnode-server/commit/cd7f2d0c6554c0814aeed6b55bdbcb19341c8314))
* temp vershoot and valve problem ([ed2c517](https://github.com/BrewnodeDave/brewnode-server/commit/ed2c517e679f236e776cd08ca20cafd78772b372))
* time mash step at temp ([3256189](https://github.com/BrewnodeDave/brewnode-server/commit/325618905572c70d3ef9e52e0e2e00101184ca52))
* time mash step at temp ([c08a904](https://github.com/BrewnodeDave/brewnode-server/commit/c08a9040f1e89fa34593a141a75c7b3138c79db1))
* trialling a AI fix to retries ([aded40c](https://github.com/BrewnodeDave/brewnode-server/commit/aded40c9428b85c9748797fc73361724e376d50b))
* trialling a AI fix to retries ([9909850](https://github.com/BrewnodeDave/brewnode-server/commit/99098508aba89eb33def4fb6bd826e47bb70d0c8))
* trialling a AI fix to retries ([e85b65c](https://github.com/BrewnodeDave/brewnode-server/commit/e85b65cc764ac8711c9eaec1b340a74ecc77156d))
* trialling a AI fix to retries ([ce7cf7c](https://github.com/BrewnodeDave/brewnode-server/commit/ce7cf7c6ded8e306ef7b57aa5897956c7d6f3c1d))
* typo brewlog.critcal -> brewlog.critical causes silent process.exit on startup ([32c0180](https://github.com/BrewnodeDave/brewnode-server/commit/32c0180bdc63edc174986682610fb6c5cceabeec))
* use mash temp for recirc ([34e1a21](https://github.com/BrewnodeDave/brewnode-server/commit/34e1a21d9026147fb6eb6bc1326d61f7cb0dc196))
* use socket parameter not _socket module var in disconnect handler ([c0a4d57](https://github.com/BrewnodeDave/brewnode-server/commit/c0a4d5706261f69e73e706e75f02f0c2a683b1f7))
* wrap raspi.init() with 8s timeout to prevent beforeAll hang ([6105a8f](https://github.com/BrewnodeDave/brewnode-server/commit/6105a8f7c6de2cdde93137e5cd671d6ae5810b4e))
* xxxx ([01fabc8](https://github.com/BrewnodeDave/brewnode-server/commit/01fabc895c16db924d1745cbdfad4f59a7389b12))
* xxxx ([cd124ad](https://github.com/BrewnodeDave/brewnode-server/commit/cd124adc840906eda3d80be3c330fd91f8ac2d3c))

## [2.4.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.3.1...v2.4.0) (2025-12-11)


### 🐛 Bug Fixes

* **api:** speedFactor endpoints now return JSON instead of plain text ([2345900](https://github.com/BrewnodeDave/brewnode-server/commit/23459003b66e4f6d620e386a824c310d5bfb9f0d))
* return kettle power ([56a9187](https://github.com/BrewnodeDave/brewnode-server/commit/56a9187b935189c4b9ae7f0aa207d5ed8b9dbac6))

### [2.3.1](https://github.com/BrewnodeDave/brewnode-server/compare/v2.3.0...v2.3.1) (2025-11-18)

## [2.3.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.0.1...v2.3.0) (2025-11-18)


### ⚠ BREAKING CHANGES

* Added brewery service startup script to handle I2C initialization

Problem Solved:
- Fixed 'modprobe: not found' errors in systemd service environment
- I2C libraries (raspi, raspi-i2c) require kernel modules but modprobe unavailable
- Service startup failures due to missing I2C module loading

Solution Components:
📄 scripts/start-brewery-service.sh - Smart startup script with module loading
📄 scripts/brewnode-server.service - Production systemd service configuration
📄 scripts/DEPLOYMENT.md - Complete deployment guide with troubleshooting
📄 package.json - Added 'start:service' npm script

Features:
✅ Pre-loads I2C modules (i2c-dev, i2c-bcm2835) before Node.js startup
✅ Pre-loads OneWire modules (w1-gpio, w1-therm) for temperature sensors
✅ Hardware availability validation with clear status messages
✅ Graceful fallback when modprobe unavailable (assumes pre-loaded modules)
✅ Proper PATH and capabilities configuration for systemd services
✅ Multiple deployment options (automatic, manual, boot-time loading)

Deployment:
sudo cp scripts/brewnode-server.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl restart brewnode-server

This resolves all I2C initialization issues for production Pi deployments!
* Added brewery service startup script to handle I2C initialization

Problem Solved:
- Fixed 'modprobe: not found' errors in systemd service environment
- I2C libraries (raspi, raspi-i2c) require kernel modules but modprobe unavailable
- Service startup failures due to missing I2C module loading

Solution Components:
📄 scripts/start-brewery-service.sh - Smart startup script with module loading
📄 scripts/brewnode-server.service - Production systemd service configuration
📄 scripts/DEPLOYMENT.md - Complete deployment guide with troubleshooting
📄 package.json - Added 'start:service' npm script

Features:
✅ Pre-loads I2C modules (i2c-dev, i2c-bcm2835) before Node.js startup
✅ Pre-loads OneWire modules (w1-gpio, w1-therm) for temperature sensors
✅ Hardware availability validation with clear status messages
✅ Graceful fallback when modprobe unavailable (assumes pre-loaded modules)
✅ Proper PATH and capabilities configuration for systemd services
✅ Multiple deployment options (automatic, manual, boot-time loading)

Deployment:
sudo cp scripts/brewnode-server.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl restart brewnode-server

This resolves all I2C initialization issues for production Pi deployments!
* Server startup now validates Pi hardware before starting services

Features:
- Runs Pi hardware tests automatically when starting on Raspberry Pi
- Blocks server startup if hardware validation fails
- Skips validation on non-Pi systems (development machines)
- Provides SKIP_HARDWARE_TESTS environment variable for debugging
- Enhanced startup logging with clear success/failure indicators
- Comprehensive error reporting for failed hardware tests

New npm scripts:
- npm run start:safe - Start with explicit hardware validation
- npm run start:skip-tests - Start bypassing hardware tests (dev only)

Safety benefits:
- Prevents brewery server from starting with faulty hardware
- Early detection of I2C, GPIO, and temperature sensor issues
- Reduces risk of brewery process failures due to hardware problems
- Clear diagnostic information for troubleshooting hardware issues

Production deployment: Server will automatically validate all connected
brewery hardware (pumps, valves, sensors) before accepting connections

### 🧪 Tests

* Add comprehensive temperature sensor validation test ([0d19abc](https://github.com/BrewnodeDave/brewnode-server/commit/0d19abcf0e1608b1190d5d870bcc0be06d7dc57e))


### 🐛 Bug Fixes

* Complete removal of Jest-based validation code ([4e7248a](https://github.com/BrewnodeDave/brewnode-server/commit/4e7248a2dfd71bf06cdfef80af1cc1a2c50af490))
* Correct pump service method names in Pi hardware tests ([78432a8](https://github.com/BrewnodeDave/brewnode-server/commit/78432a8d2a18fbce452c59e478f2215f7ff68efc))
* Correct valve name in brewery simulation test ([b89d45b](https://github.com/BrewnodeDave/brewnode-server/commit/b89d45b9b47bffe72f23d24aefbb61592ceb757c))
* export missing pump names to resolve circular dependency warnings ([3caed21](https://github.com/BrewnodeDave/brewnode-server/commit/3caed210b1ba79fe54ff8ed08e0ff1510baf77d2))
* Improve Pi hardware tests to handle missing hardware gracefully ([cd76c57](https://github.com/BrewnodeDave/brewnode-server/commit/cd76c5704661d08143551a0f86fe05c87e433598))
* resolve circular dependency warnings in sim.js ([fd00d42](https://github.com/BrewnodeDave/brewnode-server/commit/fd00d42007339586dd2cbc834f16443dee19c339))
* Update temperature sensor test to match actual service data structure ([7a2dc7e](https://github.com/BrewnodeDave/brewnode-server/commit/7a2dc7e62ad3bf6d13ab7dc21bf3e70d9d0a41ed))
* Use correct valve names in Pi hardware tests ([0516620](https://github.com/BrewnodeDave/brewnode-server/commit/0516620050dc61bdef4d11c896d196c6c96bcc43))
* wrong include ([6b3d31c](https://github.com/BrewnodeDave/brewnode-server/commit/6b3d31cc80419a48158183076b01c5e12993a5bc))


### ✨ Features

* Add Beerware LICENSE file ([b9c2fd2](https://github.com/BrewnodeDave/brewnode-server/commit/b9c2fd2679800ed6b6687fdb6410989ac1a2db35))
* Add comprehensive Pi hardware tests and update all documentation ([a810970](https://github.com/BrewnodeDave/brewnode-server/commit/a810970a707568fcb145be9034d3a40ae37222c8))
* Add Pi hardware validation during server startup ([3ad99e5](https://github.com/BrewnodeDave/brewnode-server/commit/3ad99e5cd97ca9be559d15aba26145e64a085f14))
* add release process ([f9ef177](https://github.com/BrewnodeDave/brewnode-server/commit/f9ef177a3cc32a407e49bba4cc4163c044e94f08))
* Add systemd service deployment solution for I2C module issues ([f42e56a](https://github.com/BrewnodeDave/brewnode-server/commit/f42e56aa5b4ab744ab5cf0c3aa9a73fa04319a25))
* Add systemd service deployment solution for I2C module issues ([fbec381](https://github.com/BrewnodeDave/brewnode-server/commit/fbec381c438964cbdca908c42209b32c8ae2bea4))


### 🔧 Maintenance

* missed files ([e475adc](https://github.com/BrewnodeDave/brewnode-server/commit/e475adc589e900babac36d897c5cb67c11af4a9c))

## [2.2.0] - 2025-11-18

### ✨ Features
- Added comprehensive test suite with 245 passing tests across 22 test suites
- Implemented complete Brewfather controller testing (fermentables, hops, miscs)
- Added publish/subscribe messaging system validation
- Enhanced brewing algorithms and data processing coverage

### 🧪 Tests  
- Increased test coverage from 26.58% to 34.99% statements (+8.41%)
- Achieved 100% coverage on critical controller modules
- Fixed all failing tests and eliminated flaky timing-based tests
- Added comprehensive unit tests for temperature probes configuration
- Implemented reliable async testing with proper promise handling

### 🐛 Bug Fixes
- Fixed syntax error in brewdata.js (stray character removal)
- Fixed const reassignment issue in brewlog.js 
- Fixed missing imports in brewfather controller files
- Resolved timing test reliability issues in publish.test.js

### 📚 Documentation
- Updated README with accurate test statistics and coverage breakdown
- Added detailed testing achievements section
- Updated test structure documentation to reflect current 22 test files
- Added comprehensive coverage table showing module-by-module statistics

### 🔧 Maintenance
- Fixed code quality issues identified during testing
- Improved error handling in controller modules
- Enhanced logging functionality validation