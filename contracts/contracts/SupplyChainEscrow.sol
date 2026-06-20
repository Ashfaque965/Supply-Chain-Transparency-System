// SPDX-License-Identifier: MIT
pragma solidity >=0.5.11 <0.9.0;

contract SupplyChainEscrow {
    enum Stage {
        Source,
        Warehouse,
        Retailer,
        Delivered
    }

    struct Product {
        uint256 id;
        string name;
        string origin;
        string ipfsCid;
        uint256 amountWei;
        address payer;
        address supplier;
        Stage stage;
        bool paid;
    }

    uint256 public nextProductId;
    mapping(uint256 => Product) private products;

    event ProductCreated(uint256 indexed productId, string name, string origin, uint256 amountWei);
    event StageAdvanced(uint256 indexed productId, Stage stage);
    event PaymentReleased(uint256 indexed productId, uint256 amountWei, address supplier);

    function createProduct(
        string memory name,
        string memory origin,
        string memory ipfsCid,
        address supplier
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment amount required");
        require(supplier != address(0), "Invalid supplier");

        uint256 productId = nextProductId;
        products[productId] = Product({
            id: productId,
            name: name,
            origin: origin,
            ipfsCid: ipfsCid,
            amountWei: msg.value,
            payer: msg.sender,
            supplier: supplier,
            stage: Stage.Source,
            paid: false
        });

        nextProductId += 1;
        emit ProductCreated(productId, name, origin, msg.value);
        return productId;
    }

    function advanceStage(uint256 productId) external {
        Product storage product = products[productId];
        require(product.supplier != address(0), "Product not found");
        require(msg.sender == product.supplier || msg.sender == product.payer, "Not authorized");
        require(product.stage != Stage.Delivered, "Already delivered");

        if (product.stage == Stage.Source) {
            product.stage = Stage.Warehouse;
            emit StageAdvanced(productId, product.stage);
            return;
        }

        if (product.stage == Stage.Warehouse) {
            product.stage = Stage.Retailer;
            emit StageAdvanced(productId, product.stage);
            return;
        }

        product.stage = Stage.Delivered;
        emit StageAdvanced(productId, product.stage);

        if (!product.paid) {
            product.paid = true;
            payable(product.supplier).transfer(product.amountWei);
            emit PaymentReleased(productId, product.amountWei, product.supplier);
        }
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        Product memory product = products[productId];
        require(product.supplier != address(0), "Product not found");
        return product;
    }
}
