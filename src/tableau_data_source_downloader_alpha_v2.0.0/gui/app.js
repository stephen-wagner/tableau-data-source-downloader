window.Alteryx.Gui.BeforeLoad = function (manager, AlteryxDataItems, json) {

  const token = new AlteryxDataItems.SimpleString('token');
  manager.addDataItem(token);

  const siteId = new AlteryxDataItems.SimpleString('siteId');
  manager.addDataItem(siteId);
}

window.Alteryx.Gui.AfterLoad = function (manager, AlteryxDataItems, json) {
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

window.authenticate = function authenticate(manager, AlteryxDataItems, json) {

    console.log("authenticate clicked")
    let data = JSON.stringify({
        "credentials": {
          "name": window.Alteryx.Gui.Manager.getDataItem('username').getValue(),
          "password": window.Alteryx.Gui.Manager.getDataItem('password').getValue(),
          "site": {
            "contentUrl": window.Alteryx.Gui.Manager.getDataItem('siteName').getValue()
          }
        }
      });
      
      let xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      
      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
          let response = JSON.parse(this.responseText)
          window.Alteryx.Gui.Manager.getDataItem('token').setValue(response.credentials.token);
          window.Alteryx.Gui.Manager.getDataItem('siteId').setValue(response.credentials.site.id);
          getDataSources();      
        }
      });
      
      const endpointURL = window.Alteryx.Gui.Manager.getDataItem('serverURL').getValue() + 'api/3.6/auth/signin'
      xhr.open("POST", endpointURL);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send(data);

}

window.getDataSources = function getDataSources(manager, AlteryxDataItems, json) {

  let data = null
    
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
    
  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      let response = JSON.parse(this.responseText)
      processDataSourceResponse(response.datasources.datasource)
    }
  });
    
  const endpointURL = window.Alteryx.Gui.Manager.getDataItem('serverURL').getValue() + 'api/3.6/sites/' + window.Alteryx.Gui.Manager.getDataItem('siteId').getValue() +'/datasources'
  xhr.open("GET", endpointURL);
  xhr.setRequestHeader("X-Tableau-Auth", window.Alteryx.Gui.Manager.getDataItem('token').getValue());
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Accept", "application/json");
  xhr.send(data);

}

window.processDataSourceResponse = function processDataSourceResponse(response) {
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

  window.Alteryx.Gui.Manager.getDataItem('dataSourceName').setOptionList(dataSourceList);
};
