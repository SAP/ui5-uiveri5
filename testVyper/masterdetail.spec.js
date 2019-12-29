describe('masterdetail', function () {

  it('should load the app',function() {
    expect(browser.getTitle()).toBe('Master-Detail');
  });
  
  it('should display the details screen',function() {
    element(by.control({
      viewName: 'sap.ui.demo.masterdetail.view.Master',
      controlType: 'sap.m.ObjectListItem',
      properties: {
        title: 'Object 11'
      }}))
      .click();
  });
  
  it('should validate line items',function() {
    expect(element.all(by.control({
      viewName: 'sap.ui.demo.masterdetail.view.Detail',
      controlType:'sap.m.ColumnListItem'}))
      .count()).toBe(2);
  });
});