function wildcardToRegExp (s) {
    return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$');
}

function regExpEscape (s) {
    return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

function isEmptyObject(obj) {
    return Object.entries(obj).length === 0 && obj.constructor === Object;
}

function propertyParser() {

}

function bindPropertiesPathParser() {

}

function idElementParser() {

}

function covertTouiveri5BindingInfo(bindingPath, binsindProperty){
    var prop = {};
    if(bindindPath) {
        prop.path =bindindPath;
    }
    prop.propertyPath = value;
    return prop;
}

function parseProperties(mProperties) {
    var param = {};
    if(mProperties) {
        if(mProperties.id) {
            var regex = RegExp(wildcardToRegExp(mProperties.id));
            param.id = regex;
        }
        delete mProperties.id;

        param.bindingPath = [];
        param.properties = [];
        var bindindPath = null; 
        for(var key in mProperties) {
            var controlVal = null;
            var value = mProperties[key];
            if(value && Array.isArray(value)) {
                value.map(function(locatorBindingData){
                    param.bindingPath.push(
                        covertTouiveri5BindingInfo(bindindPath, locatorBindingData)
                    );
                });
            } else if(value && value.constructor === Object) {
                param.bindingPath.push(
                    covertTouiveri5BindingInfo(bindindPath, value)
                );
            } else if(key === "bindingContextPath") {
                bindindPath = value;
                // wildCardAndNormalCompare(value, sPath)?
            } else {
              // parse properties
              param.properties.push({
                key : value
              });
              //associations & aggregations properties?
            }
        }
    }
    return param;
}

VyperToUiveri5.prototype.parseElementProperties = function(mParams) {
    var params = {};
    if(mParams.elementProperties) {
        params = parseProperties(mParams.elementProperties.mProperties);
        if(mParams.elementProperties.metadata) {
            params.controlType = mParams.elementProperties.metadata;
        }
    }
    return params;
}

VyperToUiveri5.prototype.ancestorPropertiesParser = function() {
    var ancestor = {};
    if(mParams.parentProperties) {
        ancestor = this.parseElementProperties(mParams.parentProperties.mProperties);
        if(mParams.parentProperties.metadata) {
            ancestor.controlType = mParams.parentProperties.metadata;
        }
    } else if (mParams.ancestorProperties) {
        ancestor = this.parseElementProperties(mParams.ancestorProperties.mProperties);
        if(mParams.ancestorProperties.metadata) {
            ancestor.controlType = mParams.ancestorProperties.metadata;
        }
    }
    return ancestor;
}

VyperToUiveri5.prototype.siblingPropertiesParser = function() {
    if(mParams.prevSiblingProperties || 
        mParams.nextSiblingProperties || 
        mParams.siblingProperties) {
            // ?
    }
}


VyperToUiveri5.prototype.childrenPropertiesParser = function() {
    var descendant = {};
    if(mParams.childProperties) {
        descendant = this.parseElementProperties(mParams.childProperties.mProperties);
        if(mParams.childProperties.metadata) {
            descendant.controlType = mParams.childProperties.metadata;
        }
    }
    return descendant; 
}

function VyperToUiveri5(mParams, index, parentElement){
    this.mParams = mParams;
    this.index = index;
    this.parentElement = parentElement;
}
    
module.exports = function(mParams, index, parentElement){
    return new VyperToUiveri5(mParams, index, parentElement);
};