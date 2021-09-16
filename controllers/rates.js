const path = require('path')
  ,fs = require('fs')
  ,Rates = require(path.resolve(__dirname, '..', 'models', 'rates'));

module.exports = async (req, res, next) => {
  let from = req.query.from || null,
    to = req.query.to || null
  const provider = req.query.provider || null

  if(!from || !to ||!provider ) {
    res.status(400).send('Bad request')
    return
  }

  //the first - get rates from remote. If service is unavaliable - then from db
  const providerConfigFile = path.resolve(__dirname, '..', 'config', 'sources', provider + '.json')
  if(!fs.existsSync(providerConfigFile)) {
    // review: плохо что здесь статус 200 при 'Provider not found'
    res.status(200).send('Provider not found')
  }
  // review: чтение одного и того же файла из файловой системы прямо в запросе - неоптимально, его можно прочтитать один раз при инициализации приложения (с учетом, что этот список не меняется постоянно - но в этом случае лучше бы хранить его в БД)
  const providerConfig = JSON.parse(fs.readFileSync(providerConfigFile))
    ,handlersFolder = path.resolve(__dirname, '..', 'lib', 'handlers')
    ,data = await require(path.resolve(handlersFolder, providerConfig.handler+'.js')).call(null, providerConfig, {from, to});
  if(data) { //Remote data available
    res.json(data)
  }
  else { // from DB
    res.json(await Rates.getRates(from.split(','), to.split(','), provider))
  }
}
