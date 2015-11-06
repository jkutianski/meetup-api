$scope.updateItem = function(){
$http.put(API.db+ '/' +$scope.section+ '/' +$scope.item._id, $scope.item)
.then(function(response) {
//var id = getID(response.headers('Location'));
//$state.go('admin.editItem', {section: $scope.section, id: id});
console.log(response);
})
.catch(function(err, status) {
toast.msgToast($scope.section + ' ...ocorreu um erro ao criar o item!');
})
.finally(function(){
toast.msgToast($scope.section + ' ...item atualizado!');
});

};

$scope.loadItem = function(){
ApiRestangular.one($scope.section, $stateParams.id).get().then(function(item) {
$scope.item = item;
});
};