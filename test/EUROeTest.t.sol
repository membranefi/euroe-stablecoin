// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.9.0;

import "forge-std/Test.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/EUROe.sol";
import "../contracts/mock/MockERC20.sol";
import "../contracts/mock/MockTokenV2.sol";

contract EuroeTest is Test {
    bytes32 public constant PROXYOWNER_ROLE = keccak256("PROXYOWNER_ROLE");
    bytes32 public constant BLOCKLISTER_ROLE = keccak256("BLOCKLISTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLOCKED_ROLE = keccak256("BLOCKED_ROLE");
    bytes32 public constant RESCUER_ROLE = keccak256("RESCUER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    address PROXY_OWNER = makeAddr("proxyOwner");
    address ADMIN = makeAddr("admin");
    address BLOCKLISTER = makeAddr("blocklister");
    address PAUSER = makeAddr("pauser");
    address UNPAUSER = makeAddr("unpauser");
    address MINTER = makeAddr("minter");
    address RESCUER = makeAddr("rescuer");
    address BURNER = makeAddr("burner");

    ERC1967Proxy proxy;
    EUROe implementation;
    EUROe proxied;

    function setUp() public {
        // Deploy implementation contract
        implementation = new EUROe();
        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), bytes(""));

        proxied = EUROe(address(proxy));
        proxied.initialize({
            proxyOwner: PROXY_OWNER,
            admin: ADMIN,
            blocklister: BLOCKLISTER,
            pauser: PAUSER,
            unpauser: UNPAUSER,
            minter: MINTER,
            rescuer: RESCUER,
            burner: BURNER
        });
    }

    modifier validAddress(address user) {
        vm.assume(user != address(0));
        vm.assume(!proxied.hasRole(BLOCKED_ROLE, user));
        _;
    }

    modifier validAmount(uint256 balance, uint256 amount) {
        vm.assume(balance >= amount);
        _;
    }

    modifier totalSupplyDoesNotChange() {
        uint256 supply = proxied.totalSupply();
        _;
        assertEq(proxied.totalSupply(), supply);
    }

    modifier totalSupplyDecreases(uint256 amount) {
        uint256 supply = proxied.totalSupply();
        _;
        assertEq(proxied.totalSupply(), supply - amount);
    }

    modifier totalSupplyIncreases(uint256 amount) {
        uint256 supply = proxied.totalSupply();
        _;
        assertEq(proxied.totalSupply(), supply + amount);
    }

    modifier userBalanceDoesNotChange(address user) {
        uint256 balance = proxied.balanceOf(user);
        _;
        assertEq(proxied.balanceOf(user), balance);
    }

    modifier userBalanceDecreases(address user, uint256 amount) {
        uint256 balance = proxied.balanceOf(user);
        _;
        assertEq(proxied.balanceOf(user), balance - amount);
    }

    modifier userBalanceIncreases(address user, uint256 amount) {
        uint256 balance = proxied.balanceOf(user);
        _;
        assertEq(proxied.balanceOf(user), balance + amount);
    }

    modifier mintToken(address receiver, uint256 amount) {
        vm.startPrank(MINTER);
        proxied.mint(receiver, amount);
        vm.stopPrank();
        _;
    }

    modifier hasRoleAssertion(bytes32 role, address user) {
        _;
        assertTrue(proxied.hasRole(role, user));
    }

    modifier hasNotRole(bytes32 role, address user) {
        _;
        assertFalse(proxied.hasRole(role, user));
    }

    modifier validPrivateKey(uint256 privateKey) {
        vm.assume(privateKey != 0);
        vm.assume(
            privateKey <
                115792089237316195423570985008687907852837564279074904382605163141518161494337
        );
        _;
    }

    function mintPrank(
        address minter,
        address receiver,
        uint256 amount
    ) internal {
        vm.startPrank(minter);
        proxied.mint(receiver, amount);
        vm.stopPrank();
    }

    function mintSetPrank(
        address minter,
        address[] memory targets,
        uint256[] memory amounts,
        uint256 id,
        bytes32 checksum
    ) internal {
        vm.startPrank(minter);
        proxied.mintSet(targets, amounts, id, checksum);
        vm.stopPrank();
    }

    function grantRolePrank(
        address adminRole,
        bytes32 role,
        address account
    ) internal {
        vm.startPrank(adminRole);
        proxied.grantRole(role, account);
        vm.stopPrank();
    }

    function revokeRolePrank(
        address adminRole,
        bytes32 role,
        address account
    ) internal {
        vm.startPrank(adminRole);
        proxied.revokeRole(role, account);
        vm.stopPrank();
    }

    function transferPrank(
        address sender,
        address receiver,
        uint256 amount
    ) internal {
        vm.prank(sender);
        proxied.transfer(receiver, amount);
        vm.stopPrank();
    }

    function approvePrank(
        address approver,
        address receiver,
        uint256 amount
    ) internal {
        vm.prank(approver);
        proxied.approve(receiver, amount);
        vm.stopPrank();
    }

    function transferFromPrank(
        address approver,
        address sender,
        address receiver,
        uint256 amount
    ) internal {
        vm.prank(sender);
        proxied.transferFrom(approver, receiver, amount);
        vm.stopPrank();
    }

    function burnPrank(address burner, uint256 amount) internal {
        vm.startPrank(burner);
        proxied.burn(amount);
        vm.stopPrank();
    }

    function burnFromPrank(
        address burner,
        address account,
        uint256 amount
    ) internal {
        vm.startPrank(burner);
        proxied.burnFrom(account, amount);
        vm.stopPrank();
    }

    function burnFromWithPermitPrank(
        address burner,
        uint256 privateKey,
        address spender,
        uint256 value,
        uint256 deadline,
        uint256 nonce
    ) internal {
        address owner = vm.addr(privateKey);

        bytes32 hash = hashDataToSign(owner, spender, value, deadline, nonce);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);

        vm.startPrank(burner);
        proxied.burnFromWithPermit(owner, spender, value, deadline, v, r, s);
        vm.stopPrank();
    }

    function getRoleError(address addr, bytes32 role)
        internal
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                "AccessControl: account ",
                StringsUpgradeable.toHexString(addr),
                " is missing role ",
                StringsUpgradeable.toHexString(uint256(role), 32)
            );
    }

    function hashDataToSign(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint256 nonce
    ) internal returns (bytes32) {
        bytes32 _PERMIT_TYPEHASH = keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

        bytes32 structHash = keccak256(
            abi.encode(_PERMIT_TYPEHASH, owner, spender, value, nonce, deadline)
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("EUROe Stablecoin")),
                keccak256(bytes("1")),
                block.chainid,
                address(proxied)
            )
        );

        return
            keccak256(
                abi.encodePacked("\x19\x01", domainSeparator, structHash)
            );
    }

    function test_initialize(
        address proxyOwner,
        address admin,
        address blocklister,
        address pauser,
        address unpauser,
        address minter,
        address rescuer,
        address burner
    ) public {
        vm.expectRevert("Initializable: contract is already initialized");
        proxied.initialize({
            proxyOwner: proxyOwner,
            admin: admin,
            blocklister: blocklister,
            pauser: pauser,
            unpauser: unpauser,
            minter: minter,
            rescuer: rescuer,
            burner: burner
        });
    }

    function test_proxyowner_can_upgrade() public {
        assertEq(proxied.getImplementation(), address(implementation));

        MockTokenV2 newImpl = new MockTokenV2();

        vm.startPrank(PROXY_OWNER);
        proxied.upgradeTo(address(newImpl));
        vm.stopPrank();

        assertEq(proxied.getImplementation(), address(newImpl));
    }

    function test_user_cannot_upgrade(address user) public {
        assertEq(proxied.getImplementation(), address(implementation));
        vm.assume(user != PROXY_OWNER);
        MockTokenV2 newImpl = new MockTokenV2();

        vm.startPrank(user);
        vm.expectRevert(getRoleError(user, PROXYOWNER_ROLE));
        proxied.upgradeTo(address(newImpl));
        vm.stopPrank();

        assertEq(proxied.getImplementation(), address(implementation));
    }

    function pauseContract(address addrPausing) public {
        vm.startPrank(addrPausing);
        proxied.pause();
        vm.stopPrank();
    }

    function test_pauser_can_pause() public {
        pauseContract(PAUSER);
        assertTrue(proxied.paused());
    }

    function test_pause_paused() public {
        pauseContract(PAUSER);
        vm.expectRevert("Pausable: paused");
        pauseContract(PAUSER);
    }

    function test_user_cannot_pause(address user) public {
        vm.assume(user != PAUSER);
        vm.expectRevert(getRoleError(user, PAUSER_ROLE));
        pauseContract(user);
        assertFalse(proxied.paused());
    }

    function test_paused_cannot_mint(address receiver, uint256 amount)
        public
        validAddress(receiver)
        userBalanceDoesNotChange(receiver)
    {
        pauseContract(PAUSER);
        vm.expectRevert("Pausable: paused");
        mintPrank(MINTER, receiver, amount);
    }

    function test_paused_cannot_mintSet(
        address receiver,
        uint256 amount,
        uint256 id
    )
        public
        validAddress(receiver)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(receiver)
    {
        vm.assume(amount > 0);
        address[] memory targets = new address[](1);
        targets[0] = receiver;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        pauseContract(PAUSER);
        vm.expectRevert("Pausable: paused");
        bytes32 checksum = keccak256(abi.encode(targets, amounts, id));
        mintSetPrank(MINTER, targets, amounts, id, checksum);
    }

    function test_paused_cannot_burn(uint256 amount)
        public
        mintToken(BURNER, amount)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(BURNER)
    {
        pauseContract(PAUSER);
        vm.expectRevert("Pausable: paused");
        burnPrank(BURNER, amount);
    }

    function test_paused_cannot_burnFrom(address account, uint256 amount)
        public
        validAddress(account)
        mintToken(account, amount)
        userBalanceDoesNotChange(account)
    {
        pauseContract(PAUSER);
        approvePrank(account, BURNER, amount);
        vm.expectRevert("Pausable: paused");
        burnFromPrank(BURNER, account, amount);
    }

    function test_paused_cannot_burnFromWithPermit(
        uint256 privateKey,
        uint256 value,
        uint256 deadline
    ) public validPrivateKey(privateKey) mintToken(vm.addr(privateKey), value) {
        vm.assume(deadline > block.timestamp);
        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);

        pauseContract(PAUSER);
        vm.expectRevert("Pausable: paused");
        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            BURNER,
            value,
            deadline,
            nonce
        );
    }

    function test_paused_cannot_transfer(
        address sender,
        address receiver,
        uint256 amount
    )
        public
        validAddress(sender)
        validAddress(receiver)
        mintToken(sender, amount)
        userBalanceDoesNotChange(sender)
        userBalanceDoesNotChange(receiver)
    {
        pauseContract(PAUSER);
        vm.expectRevert("Pausable: paused");
        transferPrank(sender, receiver, amount);
    }

    function test_paused_cannot_transferFrom(
        address approver,
        address sender,
        address receiver,
        uint256 amount
    )
        public
        validAddress(approver)
        validAddress(receiver)
        mintToken(approver, amount)
        userBalanceDoesNotChange(approver)
        userBalanceDoesNotChange(receiver)
    {
        vm.assume(sender != address(0));

        pauseContract(PAUSER);
        approvePrank(approver, sender, amount);
        vm.expectRevert("Pausable: paused");
        transferFromPrank(approver, sender, receiver, amount);
    }

    function test_unpauser_can_unpause() public {
        pauseContract(PAUSER);
        vm.prank(UNPAUSER);
        proxied.unpause();
        assertFalse(proxied.paused());
    }

    function test_user_cannot_unpause(address user) public {
        vm.assume(user != UNPAUSER);
        pauseContract(PAUSER);
        vm.expectRevert(getRoleError(user, UNPAUSER_ROLE));
        vm.prank(user);
        proxied.unpause();
        assertTrue(proxied.paused());
    }

    function test_unpause_notpaused() public {
        vm.expectRevert("Pausable: not paused");
        vm.prank(UNPAUSER);
        proxied.unpause();
        assertFalse(proxied.paused());
    }

    function test_unpause_unpause() public {
        pauseContract(PAUSER);
        vm.startPrank(UNPAUSER);
        proxied.unpause();
        assertFalse(proxied.paused());
        vm.expectRevert("Pausable: not paused");
        proxied.unpause();
    }

    function test_burner_can_burn(uint256 burnerBalance, uint256 amountToBurn)
        public
        validAmount(burnerBalance, amountToBurn)
        mintToken(BURNER, burnerBalance)
        userBalanceDecreases(BURNER, amountToBurn)
        totalSupplyDecreases(amountToBurn)
    {
        burnPrank(BURNER, amountToBurn);
    }

    function test_burner_insuficientBalance(
        uint256 burnerBalance,
        uint256 amountToBurn
    )
        public
        mintToken(BURNER, burnerBalance)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(BURNER)
    {
        vm.assume(amountToBurn > proxied.balanceOf(BURNER));
        vm.expectRevert("ERC20: burn amount exceeds balance");
        burnPrank(BURNER, amountToBurn);
    }

    function test_user_cannot_burn(address burner, uint256 amount)
        public
        validAddress(burner)
        mintToken(burner, amount)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(burner)
    {
        vm.assume(burner != BURNER);
        vm.expectRevert(getRoleError(burner, BURNER_ROLE));
        burnPrank(burner, amount);
    }

    function test_burner_can_burnFrom(
        address user,
        uint256 userBalance,
        uint256 burnAmount
    )
        public
        validAddress(user)
        validAmount(userBalance, burnAmount)
        mintToken(user, userBalance)
        totalSupplyDecreases(burnAmount)
    {
        approvePrank(user, BURNER, burnAmount);
        burnFromPrank(BURNER, user, burnAmount);
    }

    function test_burnFrom_insuficientBalance(
        address user,
        uint256 userBalance,
        uint256 burnAmount
    )
        public
        validAddress(user)
        mintToken(user, userBalance)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(user)
    {
        vm.assume(burnAmount > userBalance);
        approvePrank(user, BURNER, burnAmount);
        vm.expectRevert("ERC20: burn amount exceeds balance");
        burnFromPrank(BURNER, user, burnAmount);
    }

    function test_burnFrom_insuficientAllowance(
        address user,
        uint256 userBalance,
        uint256 burnAmount
    )
        public
        validAddress(user)
        mintToken(user, userBalance)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(user)
    {
        vm.assume(burnAmount > userBalance);
        approvePrank(user, BURNER, userBalance);
        vm.expectRevert("ERC20: insufficient allowance");
        burnFromPrank(BURNER, user, burnAmount);
    }

    function test_user_cannot_burnFrom(
        address burner,
        address user,
        uint256 amount
    )
        public
        validAddress(burner)
        validAddress(user)
        mintToken(user, amount)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(user)
    {
        vm.assume(burner != BURNER);
        approvePrank(user, burner, amount);
        vm.expectRevert(getRoleError(burner, BURNER_ROLE));
        burnFromPrank(burner, user, amount);
    }

    function test_burner_can_burnFromWithPermit(
        uint256 privateKey,
        uint256 value,
        uint256 deadline
    )
        public
        validPrivateKey(privateKey)
        mintToken(vm.addr(privateKey), value)
        totalSupplyDecreases(value)
    {
        vm.assume(deadline > block.timestamp);
        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);

        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            BURNER,
            value,
            deadline,
            nonce
        );
    }

    function test_burnFromWithPermit_insuffientBalance(
        uint256 privateKey,
        uint256 balance,
        uint256 value,
        uint256 deadline
    )
        public
        validPrivateKey(privateKey)
        mintToken(vm.addr(privateKey), balance)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(vm.addr(privateKey))
    {
        vm.assume(deadline > block.timestamp);
        vm.assume(value > balance);
        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);

        vm.expectRevert("ERC20: burn amount exceeds balance");
        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            BURNER,
            value,
            deadline,
            nonce
        );
    }

    function test_user_cannot_burnFromWithPermit(
        address user,
        uint256 privateKey,
        uint256 value
    )
        public
        validPrivateKey(privateKey)
        mintToken(vm.addr(privateKey), value)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(vm.addr(privateKey))
    {
        vm.assume(user != BURNER);
        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);

        vm.expectRevert(getRoleError(user, BURNER_ROLE));
        burnFromWithPermitPrank(
            user,
            privateKey,
            BURNER,
            value,
            block.timestamp + 50000,
            nonce
        );
    }

    function test_BurnFromWithPermit_signature_replay(
        uint256 privateKey,
        uint256 value,
        uint256 deadline
    )
        public
        validPrivateKey(privateKey)
        mintToken(vm.addr(privateKey), value)
        totalSupplyDecreases(value)
    {
        vm.assume(deadline > block.timestamp);
        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);

        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            BURNER,
            value,
            deadline,
            nonce
        );

        vm.expectRevert("ERC20Permit: invalid signature");
        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            BURNER,
            value,
            deadline,
            nonce
        );
    }

    function test_permit_spender_notEqual_burner_invalidSpender(
        uint256 privateKey,
        address spender,
        uint256 value,
        uint256 deadline
    )
        public
        validPrivateKey(privateKey)
        mintToken(vm.addr(privateKey), value)
        totalSupplyDoesNotChange
    {
        vm.assume(deadline > block.timestamp);
        vm.assume(spender != BURNER);
        vm.assume(spender != address(0));
        vm.assume(value != 0);

        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);

        vm.expectRevert("Invalid spender");
        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            spender,
            value,
            deadline,
            nonce
        );
    }

    function test_minter_can_mint(address account, uint256 amount)
        public
        validAddress(account)
        userBalanceIncreases(account, amount)
        totalSupplyIncreases(amount)
    {
        mintPrank(MINTER, account, amount);
    }

    function test_minter_can_mintSet(
        address account,
        uint256 amount,
        uint256 id
    )
        public
        validAddress(account)
        userBalanceIncreases(account, amount)
        totalSupplyIncreases(amount)
    {
        vm.assume(amount > 0);
        address[] memory targets = new address[](1);
        targets[0] = account;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        bytes32 checksum = keccak256(abi.encode(targets, amounts, id));
        mintSetPrank(MINTER, targets, amounts, id, checksum);
    }

    function test_user_cannot_mint(
        address minter,
        address user,
        uint256 amount
    )
        public
        validAddress(minter)
        validAddress(user)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(user)
    {
        vm.assume(minter != MINTER);
        vm.expectRevert(getRoleError(minter, MINTER_ROLE));
        mintPrank(minter, user, amount);
    }

    function test_user_cannot_mintSet(
        address minter,
        address user,
        uint256 amount,
        uint256 id
    )
        public
        validAddress(minter)
        validAddress(user)
        totalSupplyDoesNotChange
        userBalanceDoesNotChange(user)
    {
        vm.assume(minter != MINTER);
        vm.assume(amount > 0);

        address[] memory targets = new address[](1);
        targets[0] = user;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        bytes32 checksum = keccak256(abi.encode(targets, amounts, id));

        vm.expectRevert(getRoleError(minter, MINTER_ROLE));
        mintSetPrank(minter, targets, amounts, id, checksum);
    }

    function test_blocklister_can_block(address account)
        public
        hasRoleAssertion(BLOCKED_ROLE, account)
    {
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, account);
    }

    function test_user_cannot_block(address blocker, address account)
        public
        validAddress(account)
        hasNotRole(BLOCKED_ROLE, account)
    {
        vm.assume(blocker != BLOCKLISTER);
        vm.expectRevert(getRoleError(blocker, BLOCKLISTER_ROLE));
        grantRolePrank(blocker, BLOCKED_ROLE, account);
    }

    function test_blocklister_can_unblock_blocked(address account)
        public
        hasNotRole(BLOCKED_ROLE, account)
    {
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, account);
        revokeRolePrank(BLOCKLISTER, BLOCKED_ROLE, account);
    }

    function test_blocklister_can_unblock_unblocked(address account)
        public
        hasNotRole(BLOCKED_ROLE, account)
    {
        revokeRolePrank(BLOCKLISTER, BLOCKED_ROLE, account);
    }

    function test_user_cannot_unblock(address blocker, address account)
        public
        hasRoleAssertion(BLOCKED_ROLE, account)
    {
        vm.assume(blocker != BLOCKLISTER);
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, account);
        vm.expectRevert(getRoleError(blocker, BLOCKLISTER_ROLE));
        revokeRolePrank(blocker, BLOCKED_ROLE, account);
    }

    function test_admin_can_grantRole(address[7] calldata accounts) public {
        bytes32[7] memory roles = [
            PROXYOWNER_ROLE,
            BLOCKLISTER_ROLE,
            PAUSER_ROLE,
            UNPAUSER_ROLE,
            MINTER_ROLE,
            RESCUER_ROLE,
            BURNER_ROLE
        ];

        for (uint256 i = 0; i < 7; i++)
            grantRolePrank(ADMIN, roles[i], accounts[i]);

        for (uint256 i = 0; i < 7; i++)
            assertTrue(proxied.hasRole(roles[i], accounts[i]));
    }

    function test_admin_can_revokeRole(address[7] calldata accounts) public {
        bytes32[7] memory roles = [
            PROXYOWNER_ROLE,
            BLOCKLISTER_ROLE,
            PAUSER_ROLE,
            UNPAUSER_ROLE,
            MINTER_ROLE,
            RESCUER_ROLE,
            BURNER_ROLE
        ];

        for (uint256 i = 0; i < 7; i++)
            grantRolePrank(ADMIN, roles[i], accounts[i]);

        for (uint256 i = 0; i < 7; i++)
            revokeRolePrank(ADMIN, roles[i], accounts[i]);

        for (uint256 i = 0; i < 7; i++)
            assertFalse(proxied.hasRole(roles[i], accounts[i]));
    }

    function test_user_cannot_grantRole(
        address fakeAdmin,
        address[7] calldata accounts
    ) public {
        vm.assume(fakeAdmin != ADMIN);

        bytes32[7] memory roles = [
            PROXYOWNER_ROLE,
            BLOCKLISTER_ROLE,
            PAUSER_ROLE,
            UNPAUSER_ROLE,
            MINTER_ROLE,
            RESCUER_ROLE,
            BURNER_ROLE
        ];

        for (uint256 i = 0; i < 7; i++) {
            vm.expectRevert(getRoleError(fakeAdmin, DEFAULT_ADMIN_ROLE));
            grantRolePrank(fakeAdmin, roles[i], accounts[i]);
        }
    }

    function test_user_cannot_revokeRole(
        address fakeAdmin,
        address[7] calldata accounts
    ) public {
        vm.assume(fakeAdmin != ADMIN);

        bytes32[7] memory roles = [
            PROXYOWNER_ROLE,
            BLOCKLISTER_ROLE,
            PAUSER_ROLE,
            UNPAUSER_ROLE,
            MINTER_ROLE,
            RESCUER_ROLE,
            BURNER_ROLE
        ];

        for (uint256 i = 0; i < 7; i++) {
            grantRolePrank(ADMIN, roles[i], accounts[i]);
        }

        for (uint256 i = 0; i < 7; i++) {
            vm.expectRevert(getRoleError(fakeAdmin, DEFAULT_ADMIN_ROLE));
            revokeRolePrank(fakeAdmin, roles[i], accounts[i]);
        }
    }

    function test_user_cannot_renounceRole(address user) public {
        bytes32[7] memory roles = [
            PROXYOWNER_ROLE,
            BLOCKLISTER_ROLE,
            PAUSER_ROLE,
            UNPAUSER_ROLE,
            MINTER_ROLE,
            RESCUER_ROLE,
            BURNER_ROLE
        ];

        for (uint256 i = 0; i < 7; i++) {
            grantRolePrank(ADMIN, roles[i], user);
        }

        vm.startPrank(user);
        for (uint256 i = 0; i < 7; i++) {
            vm.expectRevert("Not supported");
            proxied.renounceRole(roles[i], user);
        }
        vm.stopPrank();

        for (uint256 i = 0; i < 7; i++)
            assertTrue(proxied.hasRole(roles[i], user));
    }

    function test_blocked_cannot_renounceRole(address user) public {
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, user);
        vm.prank(user);
        vm.expectRevert("Not supported");
        proxied.renounceRole(BLOCKED_ROLE, user);
    }

    function test_rescuer_can_rescue(address user, uint256 amount) public {
        vm.assume(user != address(0));
        vm.assume(user != address(proxied));

        MockERC20 token = new MockERC20();
        vm.assume(amount < token.totalSupply());
        token.transfer(address(proxied), amount);

        uint256 previousBalance = token.balanceOf(address(proxied));

        vm.prank(RESCUER);
        proxied.rescueERC20(IERC20Upgradeable(address(token)), user, amount);

        assertEq(token.balanceOf(address(proxied)), previousBalance - amount);
    }

    function test_user_cannot_rescue(
        address rescuer,
        address user,
        uint256 amount
    ) public {
        vm.assume(rescuer != RESCUER);
        vm.assume(user != address(0));
        MockERC20 token = new MockERC20();
        vm.assume(amount < token.totalSupply());
        token.transfer(address(proxied), amount);
        assertEq(token.balanceOf(address(proxied)), amount);

        vm.expectRevert(getRoleError(rescuer, RESCUER_ROLE));
        vm.prank(rescuer);
        proxied.rescueERC20(IERC20Upgradeable(address(token)), user, amount);
        assertEq(token.balanceOf(address(proxied)), amount);
    }

    function test_blocked_sender_cannot_transfer(
        address sender,
        address receiver,
        uint256 balance,
        uint256 amount
    )
        public
        validAddress(sender)
        validAddress(receiver)
        validAmount(balance, amount)
        mintToken(sender, balance)
        userBalanceDoesNotChange(sender)
    {
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, sender);
        vm.expectRevert("Blocked user");
        transferPrank(sender, receiver, amount);
    }

    function test_blocked_receiver_cannot_transfer(
        address sender,
        address receiver,
        uint256 amount
    )
        public
        validAddress(sender)
        mintToken(sender, amount)
        userBalanceDoesNotChange(sender)
        userBalanceDoesNotChange(receiver)
    {
        vm.assume(receiver != address(0));
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, receiver);
        vm.expectRevert("Blocked user");
        transferPrank(sender, receiver, amount);
    }

    function test_blocked_approver_cannot_transferFrom(
        address approver,
        address sender,
        address receiver,
        uint256 amount
    )
        public
        validAddress(approver)
        validAddress(receiver)
        mintToken(approver, amount)
        userBalanceDoesNotChange(approver)
        userBalanceDoesNotChange(receiver)
    {
        vm.assume(sender != address(0));
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, approver);
        approvePrank(approver, sender, amount);

        vm.expectRevert("Blocked user");
        transferFromPrank(approver, sender, receiver, amount);
    }

    function test_blocked_receiver_cannot_transferFrom(
        address approver,
        address sender,
        address receiver,
        uint256 amount
    )
        public
        validAddress(approver)
        mintToken(approver, amount)
        userBalanceDoesNotChange(approver)
        userBalanceDoesNotChange(receiver)
    {
        vm.assume(receiver != address(0));
        vm.assume(sender != address(0));
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, receiver);
        approvePrank(approver, sender, amount);

        vm.expectRevert("Blocked user");
        transferFromPrank(approver, sender, receiver, amount);
    }

    function test_blocked_sender_can_transferFrom(
        address approver,
        address sender,
        address receiver,
        uint256 amount
    )
        public
        validAddress(approver)
        validAddress(receiver)
        mintToken(approver, amount)
        userBalanceDecreases(approver, amount)
        userBalanceIncreases(receiver, amount)
    {
        vm.assume(sender != address(0));
        vm.assume(sender != approver);
        vm.assume(sender != receiver);
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, sender);
        approvePrank(approver, sender, amount);

        transferFromPrank(approver, sender, receiver, amount);
    }

    function test_blocked_cannot_be_minted(address user, uint256 amount)
        public
        userBalanceDoesNotChange(user)
    {
        vm.assume(user != address(0));
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, user);

        vm.expectRevert("Blocked user");
        mintPrank(MINTER, user, amount);
    }

    function test_blocked_cannot_burn(uint256 amount)
        public
        mintToken(BURNER, amount)
        userBalanceDoesNotChange(BURNER)
    {
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, BURNER);

        vm.expectRevert("Blocked user");
        burnPrank(BURNER, amount);
    }

    function test_blocked_cannot_burnFrom(address user, uint256 amount)
        public
        validAddress(user)
        mintToken(user, amount)
        userBalanceDoesNotChange(user)
    {
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, user);
        approvePrank(user, BURNER, amount);

        vm.expectRevert("Blocked user");
        burnFromPrank(BURNER, user, amount);
    }

    function test_blocked_cannot_burnFromWithPermit(
        uint256 privateKey,
        uint256 value,
        uint256 deadline
    )
        public
        validPrivateKey(privateKey)
        mintToken(vm.addr(privateKey), value)
        userBalanceDoesNotChange(vm.addr(privateKey))
    {
        vm.assume(deadline > block.timestamp);
        address owner = vm.addr(privateKey);

        uint256 nonce = proxied.nonces(owner);
        grantRolePrank(BLOCKLISTER, BLOCKED_ROLE, owner);

        vm.expectRevert("Blocked user");
        burnFromWithPermitPrank(
            BURNER,
            privateKey,
            BURNER,
            value,
            deadline,
            nonce
        );
    }
}
