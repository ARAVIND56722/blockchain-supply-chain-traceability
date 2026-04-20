// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {

    enum Status { Created, WithDistributor, WithRetailer, Sold }

    struct Product {
        string serial;
        address manufacturer;
        address distributor;
        address retailer;
        Status status;
    }

    mapping(string => Product) public products;

    event ProductCreated(string serial, address manufacturer);
    event SentToDistributor(string serial, address distributor);
    event SentToRetailer(string serial, address retailer);
    event ProductSold(string serial);

    function createProduct(string memory _serial) public {
        require(products[_serial].manufacturer == address(0), "Product already exists");

        products[_serial] = Product({
            serial: _serial,
            manufacturer: msg.sender,
            distributor: address(0),
            retailer: address(0),
            status: Status.Created
        });

        emit ProductCreated(_serial, msg.sender);
    }

    function sendToDistributor(string memory _serial, address _distributor) public {
        Product storage product = products[_serial];

        require(msg.sender == product.manufacturer, "Only manufacturer allowed");
        require(product.status == Status.Created, "Invalid stage");

        product.distributor = _distributor;
        product.status = Status.WithDistributor;

        emit SentToDistributor(_serial, _distributor);
    }

    function sendToRetailer(string memory _serial, address _retailer) public {
        Product storage product = products[_serial];

        require(msg.sender == product.distributor, "Only distributor allowed");
        require(product.status == Status.WithDistributor, "Invalid stage");

        product.retailer = _retailer;
        product.status = Status.WithRetailer;

        emit SentToRetailer(_serial, _retailer);
    }

    function markSold(string memory _serial) public {
        Product storage product = products[_serial];

        require(msg.sender == product.retailer, "Only retailer allowed");
        require(product.status == Status.WithRetailer, "Invalid stage");

        product.status = Status.Sold;

        emit ProductSold(_serial);
    }

    function verifyProduct(string memory _serial) public view returns (Product memory) {
    require(products[_serial].manufacturer != address(0), "Product does not exist");
    return products[_serial];
}
}