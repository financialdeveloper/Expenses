// Create AngularJS module.
var finances = angular.module('finances', ['firebase', 'nvd3ChartDirectives', 'ui.bootstrap']);

// Create DashboardController and bind it to the module.
var controllers = {};

controllers.DashboardController = function ($scope, $timeout, angularFireCollection, $http, myFactory) {
    $scope.expenses = [];
    $scope.maxNumberOfExpenses = 50;
    $scope.firebaseUrl = 'https://interactivedev.firebaseio.com/expenses';

    $scope.getExpenses = function () {
        if ((angular.isNumber($scope.maxNumberOfExpenses)) && ($scope.maxNumberOfExpenses > 0)) {
            $scope.expenses = angularFireCollection(new Firebase($scope.firebaseUrl).limit($scope.maxNumberOfExpenses));
        }
    };

    $scope.addExpense = function () {

        if ($scope.newExpense === undefined) {
            return;
        }
        if ($scope.newExpense.amount === undefined) {
            return;
        }
        if ($scope.newExpense.tags === undefined) {
            return;
        }

        if (isNaN(parseFloat($scope.newExpense.amount))) {
            return;
        }

        var today = new Date();
        var newExpense = $scope.newExpense;
        $scope.expenses.add({
            date: today.toISOString(),
            amount: newExpense.amount,
            tags: newExpense.tags
        });
        $scope.newExpense = null;
        myFactory.load();
    };

    $scope.updateExpense = function (expense) {
        $scope.expenses.update(expense);
    };

    $scope.removeExpense = function (expense) {
        if (confirm('Are you sure you want to remove this expense?')) {
            $scope.expenses.remove(expense);
            myFactory.load();
        }
    };

    $scope.totalExpenseAmount = function () {
        var sum = 0;
        for (var i = 0, v; v = $scope.expenses[i]; i++) {
            if (v.amount !== '') {
                sum += parseFloat(v.amount);
            }
        }
        return sum;
    };

    $scope.editExpense = function (expense) {
        expense.editing = true;
    };

    $scope.saveExpense = function (expense) {
        expense.editing = false;
        $scope.updateExpense(expense);
        myFactory.load();
    };

    function init() {
        $scope.getExpenses();
    }
    init();
};

// Factory for getting json data for chart
finances.factory('myFactory', ['$http',
    function ($http, $scope) {
        var myData = {};
        myData.data = '';
        myData.load = function () {
            this.data = $http.get('https://interactivedev.firebaseio.com/expenses.json').then(function (data) {
                return data;
                console.log("Click");
            });
            return this.data;
        };
        myData.get = function () {
            return this.data === '' ? this.load() : this.data;
        };
        return myData;
    }
]);

// Chart controller
finances.controller('ChartController', function ($scope, myFactory) {
    myFactory.load();
    myFactory.get().then(function (data) {

        $scope.exampleData = {
            key: "Expenses",
            values: []
        };
        var temp = {};

        var results = Object.keys(data.data);
        for (var i = 0; i < results.length; i++) {
            var result = data.data[results[i]];

            if (!temp[result.tags]) {
                temp[result.tags] = result;
            } else {
                temp[result.tags].amount += result.amount;
            }

            // $scope.exampleData.values.push([result.tags, result.amount]);
        }
        for (var prop in temp)
            $scope.exampleData.values.push([temp[prop].tags, temp[prop].amount]);

        $scope.$on('tooltipShow.directive', function (event) {
            console.log('scope.tooltipShow', event);
        });

        $scope.$on('tooltipHide.directive', function (event) {
            console.log('scope.tooltipHide', event);
        });

        $scope.trueData = [$scope.exampleData];

        var color = '#8BE09C';
        $scope.colorFunction = function () {
            return function () {
                return color;
            };
        }
    });
});

// Navbar controller
finances.controller('NavController', function ($scope, $location) {
    $scope.isActive = function (route) {
        return route === $location.path();
    }
});

// Modal Controllers
var ModalController = function ($scope, $modal) {

    $scope.open = function () {
        var modalInstance = $modal.open({
            templateUrl: 'partials/about.html',
            controller: ModalInstanceController
        });
    };
};

var ModalInstanceController = function ($scope, $modalInstance) {

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

// Form amount validation
var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;

finances.directive('smartFloat', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
                if (FLOAT_REGEXP.test(viewValue)) {
                    ctrl.$setValidity('float', true);
                    return parseFloat(viewValue.replace(',', '.'));
                } else {
                    ctrl.$setValidity('float', false);
                    return undefined;
                }
            });
        }
    };
});

// Define routes for the module.
finances.config(function ($routeProvider) {
    $routeProvider
        .when('/dashboard', {
            controller: controllers.DashboardController,
            templateUrl: 'partials/dashboard.html'
        })
        .when('/chart', {
            controller: finances.ChartController,
            templateUrl: 'partials/chart.html'
        })
        .otherwise({
            redirectTo: '/dashboard'
        });
});