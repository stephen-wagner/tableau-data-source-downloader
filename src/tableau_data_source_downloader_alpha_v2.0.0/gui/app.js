Alteryx.Gui.BeforeLoad = function (manager, AlteryxDataItems, json) {

  const token = new AlteryxDataItems.SimpleString('token');
  manager.addDataItem(token);

  const siteId = new AlteryxDataItems.SimpleString('siteId');
  manager.addDataItem(siteId);

}

Alteryx.Gui.AfterLoad = function (manager, AlteryxDataItems, json) {
    // To hardcode your values, enter them here and uncomment lines 6-18
    // const uiValues = [
    //     ['serverURL', 'server url'],
    //     ['siteName', 'site name'],
    //     ['username','username'],
    //     ['password', 'password'],
    //     ['dataSourceName', 'data source name'],
    //     ['downloadLocation', 'path to download file to']
    // ]

    // for (item of uiValues) {
    //     let dataItem = manager.getDataItem(item[0]);
    //     dataItem.setValue(item[1]);
    // }
    
}

authenticate = function (manager, AlteryxDataItems, json) {

  let data = JSON.stringify({
    "credentials": {
      "name": Alteryx.Gui.Manager.getDataItem('username').getValue(),
      "password": Alteryx.Gui.Manager.getDataItem('password').getValue(),
      "site": {
        "contentUrl": Alteryx.Gui.Manager.getDataItem('siteName').getValue()
      }
    }
  });
  
  let request = new XMLHttpRequest();
  request.withCredentials = true;

  return new this.Promise(function (resolve, reject) {
    
    request.onreadystatechange = function () {

      // Only run if the request is complete
      if (request.readyState !== 4) return;

      // Process the response
      if (request.status >= 200 && request.status < 300) {
        // If successful
        let response = JSON.parse(this.responseText)
        Alteryx.Gui.Manager.getDataItem('token').setValue(response.credentials.token)
        Alteryx.Gui.Manager.getDataItem('siteId').setValue(response.credentials.site.id)
        resolve(request)
      } else {
        // If failed
        reject({
          status: request.status,
          statusText: request.statusText
        });
      }

  };

  // Setup our HTTP request
  const endpointURL = Alteryx.Gui.Manager.getDataItem('serverURL').getValue() + 'api/3.6/auth/signin'
  request.open('POST', endpointURL, true);
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Accept", "application/json");
  // Send the request
  request.send(data);
  }) 
}

getDataSources = function (manager, AlteryxDataItems, json) {

  let request = new XMLHttpRequest();
  request.withCredentials = true;

  return new this.Promise(function (resolve, reject) {
    
    request.onreadystatechange = function () {

      // Only run if the request is complete
      if (request.readyState !== 4) return;

      // Process the response
      if (request.status >= 200 && request.status < 300) {
        // If successful
        let response = JSON.parse(this.responseText)
        processDataSourceResponse(response.datasources.datasource)
        resolve(request)
      } else {
        // If failed
        reject({
          status: request.status,
          statusText: request.statusText
        });
      }

  };

  // Setup our HTTP request
  const endpointURL = Alteryx.Gui.Manager.getDataItem('serverURL').getValue() + 'api/3.6/sites/' + Alteryx.Gui.Manager.getDataItem('siteId').getValue() +'/datasources'
  request.open('GET', endpointURL, true);
  request.setRequestHeader("X-Tableau-Auth", Alteryx.Gui.Manager.getDataItem('token').getValue());
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Accept", "application/json");
  // Send the request
  request.send();
  }) 

}

processDataSourceResponse = function (response) {
  const data = response
  const dataSourceList = [];

  data.forEach((item) => {
    dataSourceList.push({
      value: item.name,
      label: item.name,
    });
  });

  // sort dataset list alphabetically (Asc)
  dataSourceList.sort((a, b) => {
    const uiobjectA = a.label.toLowerCase();
    const uiobjectB = b.label.toLowerCase();

    if (uiobjectA < uiobjectB) {
      return -1;
    }
    if (uiobjectA > uiobjectB) {
      return 1;
    }
    return 0;
  });

  Alteryx.Gui.Manager.getDataItem('dataSourceName').setOptionList(dataSourceList);
};

populateDataSourceNames = function(manager, AlteryxDataItems, json) {
  // clear error messages
  errorMessageToggle(false)

  authenticate()
    .then(getDataSources)
    .catch(function (error) {
      errorMessageToggle(true, error)
    })
}

errorMessageToggle = function(flag, error) {
  if (flag) {
    var target = document.getElementById('api-error')
    target.innerHTML = `Status ${error.status}: ${error.statusText}`
    target.className = 'error'
  } else {
    var target = document.getElementById('api-error')
    target.innerHTML = ""
    target.className = ''
  }
}