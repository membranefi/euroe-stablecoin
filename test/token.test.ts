import { expect, use } from "chai";
import { upgrades } from "hardhat";
import { deployMockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signERC2612Permit } from "eth-permit";
import {
  MockERC20,
  MockERC20__factory,
  MockToken,
  MockTokenV2,
  MockTokenV2__factory,
} from "../typechain/euroe";
import { ethers, waffle } from "hardhat";
import {
  addPermit,
  burnWithPermit,
  getMintChecksum,
  getRoleBytes,
  getRoleError,
  singleMint,
} from "../scripts/tools";

const { loadFixture } = waffle;

const TOKEN_DECIMALS = 6;
const mintAmount = 10;

const PROXYOWNER_ROLE = "PROXYOWNER_ROLE";
const BLOCKLISTER_ROLE = "BLOCKLISTER_ROLE";
const PAUSER_ROLE = "PAUSER_ROLE";
const UNPAUSER_ROLE = "UNPAUSER_ROLE";
const MINTER_ROLE = "MINTER_ROLE";
const BLOCKED_ROLE = "BLOCKED_ROLE";
const RESCUER_ROLE = "RESCUER_ROLE";
const BURNER_ROLE = "BURNER_ROLE";
const DEFAULT_ADMIN_ROLE = "DEFAULT_ADMIN_ROLE";

describe("Token", () => {
  async function fixture() {
    const accounts = await ethers.getSigners();
    const proxyOwner = accounts[0],
      admin = accounts[1],
      blocklister = accounts[2],
      pauser = accounts[3],
      unpauser = accounts[4],
      minter = accounts[5],
      rescuer = accounts[6],
      burner = accounts[7];

    const userWithTokens = accounts[8];
    const user1 = accounts[9];
    const user2 = accounts[10];

    const Token = await ethers.getContractFactory("MockToken");
    const deployment = await upgrades.deployProxy(
      Token,
      [
        proxyOwner.address,
        admin.address,
        blocklister.address,
        pauser.address,
        unpauser.address,
        minter.address,
        rescuer.address,
        burner.address,
      ],
      {
        kind: "uups",
      }
    );
    const erc20 = (await deployment.deployed()) as MockToken;

    await erc20.freeMint(userWithTokens.address, mintAmount);

    // Deploy another dummy token, without real upgradability
    const dummyToken = await new MockERC20__factory(proxyOwner).deploy();

    // Deploy a new version of the implementation
    const erc20v2 = await new MockTokenV2__factory(proxyOwner).deploy();

    return {
      erc20,
      erc20v2,
      dummyToken,
      users: {
        proxyOwner,
        admin,
        blocklister,
        pauser,
        unpauser,
        minter,
        rescuer,
        burner,
        userWithTokens,
        user1,
        user2,
      },
    };
  }

  let proxyOwner: SignerWithAddress,
    admin: SignerWithAddress,
    blocklister: SignerWithAddress,
    pauser: SignerWithAddress,
    unpauser: SignerWithAddress,
    minter: SignerWithAddress,
    rescuer: SignerWithAddress,
    burner: SignerWithAddress,
    userWithTokens: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress;
  let erc20: MockToken;
  let erc20v2: MockTokenV2;
  let dummytoken: MockERC20;

  beforeEach(async () => {
    const r = await loadFixture(fixture);

    erc20 = r.erc20;
    erc20v2 = r.erc20v2;
    dummytoken = r.dummyToken;
    proxyOwner = r.users.proxyOwner;
    admin = r.users.admin;
    blocklister = r.users.blocklister;
    pauser = r.users.pauser;
    unpauser = r.users.unpauser;
    minter = r.users.minter;
    rescuer = r.users.rescuer;
    burner = r.users.burner;
    userWithTokens = r.users.userWithTokens;
    user1 = r.users.user1;
    user2 = r.users.user2;
  });

  describe("Basic ERC-20 functionality", () => {
    it("symbol()", async () => {
      expect(await erc20.symbol()).to.equal("EUROe");
    });

    it("decimals()", async () => {
      expect(await erc20.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("totalSupply()", async () => {
      expect(await erc20.totalSupply()).to.equal(mintAmount);
    });

    it("transfer()", async () => {
      const transfer = () =>
        erc20.connect(userWithTokens).transfer(user1.address, mintAmount);
      await expect(transfer).to.changeTokenBalances(
        erc20,
        [userWithTokens, user1],
        [-mintAmount, mintAmount]
      );
    });

    it("transfer() event", async () => {
      const transfer = erc20
        .connect(userWithTokens)
        .transfer(user1.address, mintAmount);
      await expect(transfer)
        .to.emit(erc20, "Transfer")
        .withArgs(userWithTokens.address, user1.address, mintAmount);
    });

    it("transferFrom()", async () => {
      await erc20.connect(userWithTokens).approve(user1.address, mintAmount);

      const transferFrom = () =>
        erc20
          .connect(user1)
          .transferFrom(userWithTokens.address, user1.address, mintAmount);

      await expect(transferFrom).to.changeTokenBalances(
        erc20,
        [userWithTokens, user1],
        [-mintAmount, mintAmount]
      );

      const allowance = await erc20.allowance(
        userWithTokens.address,
        user1.address
      );

      expect(allowance).to.equal(0);
    });

    it("transferFrom() events", async () => {
      const approval = erc20
        .connect(userWithTokens)
        .approve(user1.address, mintAmount);

      await expect(approval)
        .to.emit(erc20, "Approval")
        .withArgs(userWithTokens.address, user1.address, mintAmount);

      const transferFrom = erc20
        .connect(user1)
        .transferFrom(userWithTokens.address, user1.address, mintAmount);

      await expect(transferFrom)
        .to.emit(erc20, "Transfer")
        .withArgs(userWithTokens.address, user1.address, mintAmount)
        .to.emit(erc20, "Approval")
        .withArgs(userWithTokens.address, user1.address, 0);
    });

    it("transfer() reverts", async () => {
      await expect(
        erc20.connect(userWithTokens).transfer(user1.address, mintAmount * 2)
      ).to.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("transferFrom() exceeds allowance", async () => {
      await expect(
        erc20
          .connect(userWithTokens)
          .transferFrom(user1.address, userWithTokens.address, 1)
      ).to.revertedWith("ERC20: insufficient allowance");
    });

    it("transferFrom() exceeds balance", async () => {
      await erc20.connect(userWithTokens).approve(user1.address, mintAmount);
      await erc20
        .connect(userWithTokens)
        .transfer(user2.address, mintAmount / 2);
      await expect(
        erc20
          .connect(user1)
          .transferFrom(userWithTokens.address, user1.address, mintAmount)
      ).to.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("permit works", async () => {
      const value = 3;
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 5000;

      await addPermit(erc20, userWithTokens, user1, value, deadline);

      const transferFrom = () =>
        erc20
          .connect(user1)
          .transferFrom(userWithTokens.address, user1.address, 2);

      await expect(transferFrom).to.changeTokenBalances(
        erc20,
        [userWithTokens, user1],
        [-2, 2]
      );
    });
  });

  describe("Preassigned user roles", () => {
    const hasRole = async (role: string, address: string) => {
      return await erc20.hasRole(getRoleBytes(role), address);
    };

    it("Preassigned users have exactly one role", async () => {
      // Checks whether the address has exactly one role
      const hasOneRole = async (address: string) => {
        const values = [
          await hasRole(PROXYOWNER_ROLE, address),
          await hasRole(DEFAULT_ADMIN_ROLE, address),
          await hasRole(BLOCKLISTER_ROLE, address),
          await hasRole(PAUSER_ROLE, address),
          await hasRole(UNPAUSER_ROLE, address),
          await hasRole(MINTER_ROLE, address),
          await hasRole(RESCUER_ROLE, address),
          await hasRole(BURNER_ROLE, address),
        ];
        return values.filter((v) => v).length == 1;
      };

      expect(await hasOneRole(proxyOwner.address)).to.true;
      expect(await hasOneRole(admin.address)).to.true;
      expect(await hasOneRole(blocklister.address)).to.true;
      expect(await hasOneRole(pauser.address)).to.true;
      expect(await hasOneRole(unpauser.address)).to.true;
      expect(await hasOneRole(minter.address)).to.true;
      expect(await hasOneRole(rescuer.address)).to.true;
      expect(await hasOneRole(burner.address)).to.true;
    });

    it("Preassigned users have their assigned role", async () => {
      expect(await hasRole(PROXYOWNER_ROLE, proxyOwner.address)).to.true;
      expect(await hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.true;
      expect(await hasRole(BLOCKLISTER_ROLE, blocklister.address)).to.true;
      expect(await hasRole(PAUSER_ROLE, pauser.address)).to.true;
      expect(await hasRole(UNPAUSER_ROLE, unpauser.address)).to.true;
      expect(await hasRole(MINTER_ROLE, minter.address)).to.true;
      expect(await hasRole(RESCUER_ROLE, rescuer.address)).to.true;
      expect(await hasRole(BURNER_ROLE, burner.address)).to.true;
    });
  });

  describe("Role access restrictions: ", () => {
    describe("proxyOwner", () => {
      it("is authorized to upgrade", async () => {
        await erc20.connect(proxyOwner).checkAuthorizeUpgrade();
      });
    });

    describe("admin", () => {
      describe("can add and remove role", () => {
        const checkRole = async (role: string) => {
          await erc20
            .connect(admin)
            .grantRole(getRoleBytes(role), user1.address);
          expect(await erc20.hasRole(getRoleBytes(role), user1.address)).to
            .true;

          await erc20
            .connect(admin)
            .revokeRole(getRoleBytes(role), user1.address);
          expect(await erc20.hasRole(getRoleBytes(role), user1.address)).to
            .false;
        };
        it("admin", async () => {
          await checkRole(DEFAULT_ADMIN_ROLE);
        });
        it("proxyOwner", async () => {
          await checkRole(PROXYOWNER_ROLE);
        });
        it("blocklister", async () => {
          await checkRole(BLOCKLISTER_ROLE);
        });
        it("pauser", async () => {
          await checkRole(PAUSER_ROLE);
        });
        it("unpauser", async () => {
          await checkRole(UNPAUSER_ROLE);
        });
        it("minter", async () => {
          await checkRole(MINTER_ROLE);
        });
        it("rescuer", async () => {
          await checkRole(RESCUER_ROLE);
        });
        it("burner", async () => {
          await checkRole(BURNER_ROLE);
        });
      });

      it("can add the same role to multiple addresses", async () => {
        await erc20
          .connect(admin)
          .grantRole(getRoleBytes(MINTER_ROLE), user1.address);

        await erc20
          .connect(admin)
          .grantRole(getRoleBytes(MINTER_ROLE), user2.address);

        expect(await erc20.hasRole(getRoleBytes(MINTER_ROLE), user1.address)).to
          .true;

        expect(await erc20.hasRole(getRoleBytes(MINTER_ROLE), user2.address)).to
          .true;
      });

      it("can't modify blocked role", async () => {
        await expect(
          erc20
            .connect(admin)
            .grantRole(getRoleBytes(BLOCKED_ROLE), user1.address)
        ).to.be.revertedWith(getRoleError(admin.address, BLOCKLISTER_ROLE));
      });

      it("can't renounce their role", async () => {
        await expect(
          erc20
            .connect(admin)
            .renounceRole(getRoleBytes(DEFAULT_ADMIN_ROLE), admin.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("blocklister", () => {
      it("can block", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), user1.address);

        expect(await erc20.hasRole(getRoleBytes(BLOCKED_ROLE), user1.address))
          .to.true;
      });

      it("can unblock", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), user1.address);

        await erc20
          .connect(blocklister)
          .revokeRole(getRoleBytes(BLOCKED_ROLE), user1.address);

        expect(await erc20.hasRole(getRoleBytes(BLOCKED_ROLE), user1.address))
          .to.false;
      });

      it("can't renounce their role", async () => {
        await expect(
          erc20
            .connect(blocklister)
            .renounceRole(getRoleBytes(BLOCKLISTER_ROLE), blocklister.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("pauser and unpauser", () => {
      it("Pauser can pause", async () => {
        await erc20.connect(pauser).pause();
        expect(await erc20.paused()).to.true;
      });

      it("Unpauser can unpause", async () => {
        await erc20.connect(pauser).pause();
        await erc20.connect(unpauser).unpause();
        expect(await erc20.paused()).to.false;
      });

      it("Pauser can't unpause", async () => {
        await erc20.connect(pauser).pause();

        await expect(erc20.connect(pauser).unpause()).to.revertedWith(
          getRoleError(pauser.address, UNPAUSER_ROLE)
        );
      });

      it("Unpauser can't pause", async () => {
        await expect(erc20.connect(unpauser).pause()).to.revertedWith(
          getRoleError(unpauser.address, PAUSER_ROLE)
        );
      });

      it("pauser can't renounce their role", async () => {
        await expect(
          erc20
            .connect(pauser)
            .renounceRole(getRoleBytes(PAUSER_ROLE), pauser.address)
        ).to.be.revertedWith("Not supported");
      });

      it("unpauser can't renounce their role", async () => {
        await expect(
          erc20
            .connect(unpauser)
            .renounceRole(getRoleBytes(UNPAUSER_ROLE), unpauser.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("minter", () => {
      it("can mint", async () => {
        const mint = () => erc20.connect(minter).mint(user1.address, 5);

        await expect(mint).to.changeTokenBalance(erc20, user1, 5);
      });

      it("can batch mint", async () => {
        const mint = () => singleMint(erc20, minter, user1.address, 5);

        await expect(mint).to.changeTokenBalance(erc20, user1, 5);
      });

      it("can't renounce their role", async () => {
        await expect(
          erc20
            .connect(minter)
            .renounceRole(getRoleBytes(MINTER_ROLE), minter.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("rescuer", () => {
      it("can call token rescue", async () => {
        await erc20
          .connect(rescuer)
          .rescueERC20(dummytoken.address, user1.address, 0);
      });

      it("can't renounce their role", async () => {
        await expect(
          erc20
            .connect(rescuer)
            .renounceRole(getRoleBytes(RESCUER_ROLE), rescuer.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("burner", () => {
      it("can burn", async () => {
        await erc20.connect(userWithTokens).transfer(burner.address, 2);
        await erc20.connect(burner).burn(2);
      });

      it("can burnFrom", async () => {
        // Note: this doesn't test whether the burn succeeds (it wouldn't, but the amount is zero here)
        await erc20.connect(burner).burnFrom(userWithTokens.address, 0);
      });

      it("can't renounce their role", async () => {
        await expect(
          erc20
            .connect(burner)
            .renounceRole(getRoleBytes(BURNER_ROLE), burner.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("blocked", () => {
      let blockedUser;
      beforeEach(async () => {
        blockedUser = user1;
        await erc20.connect(userWithTokens).transfer(blockedUser.address, 2);
        await erc20.connect(userWithTokens).transfer(user2.address, 2);
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), blockedUser.address);
      });

      it("can't be the origin of transfer", async () => {
        await expect(
          erc20.connect(blockedUser).transfer(user2.address, 2)
        ).to.revertedWith("Blocked user");
      });

      it("can't be the target of transfer", async () => {
        await expect(
          erc20.connect(userWithTokens).transfer(blockedUser.address, 1)
        ).to.revertedWith("Blocked user");
      });

      it("can't be the origin of transferFrom", async () => {
        await erc20.connect(blockedUser).approve(user2.address, 2);
        await expect(
          erc20
            .connect(user2)
            .transferFrom(blockedUser.address, user2.address, 2)
        ).to.revertedWith("Blocked user");
      });

      it("can't be the target of transferFrom", async () => {
        await erc20.connect(user2).approve(blockedUser.address, 2);
        await expect(
          erc20
            .connect(blockedUser)
            .transferFrom(user2.address, blockedUser.address, 2)
        ).to.revertedWith("Blocked user");
      });

      it("can't be single minted to", async () => {
        await expect(
          erc20.connect(minter).mint(blockedUser.address, 1)
        ).to.revertedWith("Blocked user");
      });

      it("can single mint", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), minter.address);

        await erc20.connect(minter).mint(user2.address, 1);
      });

      it("can't be batch minted to", async () => {
        await expect(
          singleMint(erc20, minter, blockedUser.address, 1)
        ).to.revertedWith("Blocked user");
      });

      it("can batch mint", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), minter.address);

        await singleMint(erc20, minter, user2.address, 1);
      });

      it("can't be burned from", async () => {
        await erc20.connect(blockedUser).approve(burner.address, 1);
        await expect(
          erc20.connect(burner).burnFrom(blockedUser.address, 1)
        ).to.revertedWith("Blocked user");
      });

      it("can burn", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), burner.address);
        await erc20.connect(user2).approve(burner.address, 1);

        erc20.connect(burner).burnFrom(user2.address, 1);
      });

      it("can't be burned from with permit", async () => {
        const deadline =
          (await ethers.provider.getBlock("latest")).timestamp + 5000;
        await erc20.connect(blockedUser).approve(burner.address, 1);

        await expect(
          burnWithPermit(erc20, blockedUser, burner, 1, deadline)
        ).to.be.revertedWith("Blocked user");
      });

      it("can burn with permit", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), burner.address);
        await erc20.connect(user2).approve(burner.address, 1);

        const deadline =
          (await ethers.provider.getBlock("latest")).timestamp + 5000;

        await burnWithPermit(erc20, user2, burner, 1, deadline);
      });

      it("can be rescue target", async () => {
        await dummytoken.connect(proxyOwner).transfer(erc20.address, 6);

        await erc20
          .connect(rescuer)
          .rescueERC20(dummytoken.address, blockedUser.address, 4);
      });

      it("can rescue", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), rescuer.address);

        await dummytoken.connect(proxyOwner).transfer(erc20.address, 6);

        await erc20
          .connect(rescuer)
          .rescueERC20(dummytoken.address, user2.address, 4);
      });

      it("can't renounce their role", async () => {
        await expect(
          erc20
            .connect(blockedUser)
            .renounceRole(getRoleBytes(BLOCKED_ROLE), blockedUser.address)
        ).to.be.revertedWith("Not supported");
      });
    });

    describe("without role", () => {
      it("can't pause", async () => {
        await expect(erc20.connect(user1).pause()).to.revertedWith(
          getRoleError(user1.address, PAUSER_ROLE)
        );
      });

      it("can't unpause", async () => {
        await erc20.connect(pauser).pause();
        await expect(erc20.connect(user1).unpause()).to.revertedWith(
          getRoleError(user1.address, UNPAUSER_ROLE)
        );
      });

      it("can't burn", async () => {
        await expect(erc20.connect(userWithTokens).burn(1)).to.revertedWith(
          getRoleError(userWithTokens.address, BURNER_ROLE)
        );
      });

      it("can't burnFrom", async () => {
        await expect(
          erc20.connect(user1).burnFrom(userWithTokens.address, 0)
        ).to.revertedWith(getRoleError(user1.address, BURNER_ROLE));
      });

      it("can't burnFrom along with a permit", async () => {
        const deadline =
          (await ethers.provider.getBlock("latest")).timestamp + 5000;

        await expect(
          burnWithPermit(erc20, userWithTokens, user1, 0, deadline)
        ).to.revertedWith(getRoleError(user1.address, BURNER_ROLE));
      });

      it("can't mint", async () => {
        await expect(
          erc20.connect(user1).mint(user1.address, 10)
        ).to.revertedWith(getRoleError(user1.address, MINTER_ROLE));
      });

      it("can't batch mint", async () => {
        await expect(
          singleMint(erc20, user1, user2.address, 10)
        ).to.revertedWith(getRoleError(user1.address, MINTER_ROLE));
      });

      it("can't upgrade", async () => {
        await expect(
          erc20.connect(user1).checkAuthorizeUpgrade()
        ).to.revertedWith(getRoleError(user1.address, PROXYOWNER_ROLE));
      });

      it("can't rescue tokens", async () => {
        await expect(
          erc20.connect(user1).rescueERC20(dummytoken.address, user2.address, 1)
        ).to.revertedWith(getRoleError(user1.address, RESCUER_ROLE));
      });

      it("can't add roles", async () => {
        await expect(
          erc20
            .connect(user1)
            .grantRole(getRoleBytes(MINTER_ROLE), user2.address)
        ).to.revertedWith(getRoleError(user1.address, DEFAULT_ADMIN_ROLE));
      });

      it("can't remove roles", async () => {
        await expect(
          erc20
            .connect(user1)
            .revokeRole(getRoleBytes(MINTER_ROLE), minter.address)
        ).to.revertedWith(getRoleError(user1.address, DEFAULT_ADMIN_ROLE));
      });
    });
  });

  describe("Pausing", () => {
    it("prevents sending", async () => {
      await erc20.connect(pauser).pause();
      await expect(
        erc20.connect(userWithTokens).transfer(user1.address, 1)
      ).to.revertedWith("Pausable: paused");
    });

    it("prevents receiving with transferFrom", async () => {
      await erc20.connect(pauser).pause();
      await erc20.connect(userWithTokens).approve(user1.address, 2);
      await expect(
        erc20
          .connect(user1)
          .transferFrom(userWithTokens.address, user1.address, 1)
      ).to.revertedWith("Pausable: paused");
    });

    it("prevents direct burn", async () => {
      await erc20.connect(pauser).pause();
      await expect(erc20.connect(burner).burn(0)).to.revertedWith(
        "Pausable: paused"
      );
    });

    it("prevents burnFrom", async () => {
      await erc20.connect(pauser).pause();
      await expect(
        erc20.connect(burner).burnFrom(userWithTokens.address, 0)
      ).to.revertedWith("Pausable: paused");
    });

    it("prevents burnFrom with permit", async () => {
      await erc20.connect(pauser).pause();
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 5000;

      await expect(
        burnWithPermit(erc20, userWithTokens, burner, 0, deadline)
      ).to.revertedWith("Pausable: paused");
    });

    it("prevents single minting", async () => {
      await erc20.connect(pauser).pause();
      await expect(
        erc20.connect(minter).mint(user1.address, 2)
      ).to.revertedWith("Pausable: paused");
    });

    it("prevents batch minting", async () => {
      await erc20.connect(pauser).pause();
      await expect(singleMint(erc20, minter, user1.address, 1)).to.revertedWith(
        "Pausable: paused"
      );
    });
  });

  describe("Burning", () => {
    describe("Regular burning", () => {
      it("works", async () => {
        await erc20.connect(userWithTokens).transfer(burner.address, 2);
        const burn = () => erc20.connect(burner).burn(2);
        await expect(burn).to.changeTokenBalance(erc20, burner, -2);
        await expect(await erc20.totalSupply()).to.equal(mintAmount - 2);
      });

      it("burning with normal allowance works", async () => {
        await erc20.connect(userWithTokens).approve(burner.address, 5);

        const burn = () =>
          erc20.connect(burner).burnFrom(userWithTokens.address, 2);

        await expect(burn).to.changeTokenBalance(erc20, userWithTokens, -2);
        await expect(await erc20.totalSupply()).to.equal(mintAmount - 2);
      });

      it("burning emits events", async () => {
        await erc20.connect(userWithTokens).approve(burner.address, 5);

        const burn = erc20.connect(burner).burnFrom(userWithTokens.address, 2);

        await expect(burn)
          .to.emit(erc20, "Transfer")
          .withArgs(userWithTokens.address, ethers.constants.AddressZero, 2);
      });

      it("burnFrom after permit works", async () => {
        const value = 3;
        const deadline =
          (await ethers.provider.getBlock("latest")).timestamp + 5000;

        await addPermit(erc20, userWithTokens, burner, value, deadline);

        const burn = () =>
          erc20.connect(burner).burnFrom(userWithTokens.address, 2);

        await expect(burn).to.changeTokenBalance(erc20, userWithTokens, -2);
      });

      it("burning without allowance fails", async () => {
        const burn = erc20.connect(burner).burnFrom(userWithTokens.address, 2);

        await expect(burn).to.revertedWith("ERC20: insufficient allowance");
      });

      it("burning from blocked address fails", async () => {
        await erc20.connect(userWithTokens).approve(burner.address, 5);
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), userWithTokens.address);

        const burn = erc20.connect(burner).burnFrom(userWithTokens.address, 2);

        await expect(burn).to.revertedWith("Blocked user");
      });
    });

    describe("Burning along a permit", () => {
      it("works", async () => {
        const value = 2;
        const deadline =
          (await ethers.provider.getBlock("latest")).timestamp + 5000;

        const burn = burnWithPermit(
          erc20,
          userWithTokens,
          burner,
          value,
          deadline
        );

        await expect(() => burn).to.changeTokenBalance(
          erc20,
          userWithTokens,
          -2
        );
      });

      it("fails if spender isn't the sender", async () => {
        const value = 2;
        const deadline =
          (await ethers.provider.getBlock("latest")).timestamp + 5000;

        const result = await signERC2612Permit(
          userWithTokens,
          erc20.address,
          userWithTokens.address,
          user1.address,
          value,
          deadline
        );

        await expect(
          erc20
            .connect(burner)
            .burnFromWithPermit(
              userWithTokens.address,
              user1.address,
              value,
              deadline,
              result.v,
              result.r,
              result.s
            )
        ).to.revertedWith("Invalid spender");
      });
    });
  });

  describe("Permit", () => {
    it("works", async () => {
      const value = 3;
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 5000;

      await addPermit(erc20, userWithTokens, burner, value, deadline);

      const allowance = await erc20.allowance(
        userWithTokens.address,
        burner.address
      );
      expect(allowance).to.be.equal(value);
    });

    it("creating expired permit fails", async () => {
      const value = 3;
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp - 5000;

      await expect(
        addPermit(erc20, userWithTokens, burner, value, deadline)
      ).to.revertedWith("ERC20Permit: expired deadline");
    });
  });

  describe("Minting", () => {
    describe("Single minting", () => {
      it("works", async () => {
        await expect(() =>
          erc20.connect(minter).mint(user1.address, 2)
        ).to.changeTokenBalance(erc20, user1, 2);
        await expect(await erc20.totalSupply()).to.equal(mintAmount + 2);
      });

      it("emits transfer events", async () => {
        await expect(erc20.connect(minter).mint(user1.address, 2))
          .to.emit(erc20, "Transfer")
          .withArgs(ethers.constants.AddressZero, user1.address, 2);
      });

      it("can mint zero", async () => {
        erc20.connect(minter).mint(user1.address, 0);
      });

      it("minting to blocked address fails", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), user1.address);

        await expect(
          erc20.connect(minter).mint(user1.address, 2)
        ).to.revertedWith("Blocked user");
      });
    });

    describe("Multiple minting", () => {
      it("works for single", async () => {
        await expect(() =>
          singleMint(erc20, minter, user1.address, 2)
        ).to.changeTokenBalance(erc20, user1, 2);
        await expect(await erc20.totalSupply()).to.equal(mintAmount + 2);
      });

      it("works for multiple", async () => {
        const targets = [user1.address, user2.address, admin.address];
        const amounts = [1, 2, 3];
        await expect(() =>
          erc20
            .connect(minter)
            .mintSet(targets, amounts, 1, getMintChecksum(targets, amounts, 1))
        ).to.changeTokenBalances(erc20, [user1, user2, admin], [1, 2, 3]);
        await expect(await erc20.totalSupply()).to.equal(mintAmount + 6);
      });

      it("can mint multiple times to the same target", async () => {
        const targets = [user1.address, user1.address, admin.address];
        const amounts = [1, 2, 4];
        await expect(() =>
          erc20
            .connect(minter)
            .mintSet(targets, amounts, 1, getMintChecksum(targets, amounts, 1))
        ).to.changeTokenBalances(erc20, [user1, admin], [3, 4]);
        await expect(await erc20.totalSupply()).to.equal(mintAmount + 7);
      });

      it("emits main event", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address],
              [7],
              6,
              getMintChecksum([user1.address], [7], 6)
            )
        )
          .to.emit(erc20, "MintingSetCompleted")
          .withArgs(6);
      });

      it("emits transfer events", async () => {
        const user1Amount = 7;
        const user2Amount = 8;
        const id = 6;
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address, user2.address],
              [user1Amount, user2Amount],
              id,
              getMintChecksum(
                [user1.address, user2.address],
                [user1Amount, user2Amount],
                id
              )
            )
        )
          .to.emit(erc20, "Transfer")
          .withArgs(ethers.constants.AddressZero, user1.address, user1Amount)
          .to.emit(erc20, "Transfer")
          .withArgs(ethers.constants.AddressZero, user2.address, user2Amount);
      });

      it("can't mint zero", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [minter.address],
              [0],
              1,
              getMintChecksum([minter.address], [0], 1)
            )
        ).to.revertedWith("Mint amount not greater than 0");
      });

      it("minting empty list fails", async () => {
        await expect(
          erc20.connect(minter).mintSet([], [], 1, getMintChecksum([], [], 1))
        ).to.revertedWith("Nothing to mint");
      });

      it("minting mismatch fails", async () => {
        await expect(
          erc20.connect(minter).mintSet([], [1], 1, getMintChecksum([], [1], 1))
        ).to.revertedWith("Unmatching mint lengths");
      });

      it("minting to blocked address fails", async () => {
        await erc20
          .connect(blocklister)
          .grantRole(getRoleBytes(BLOCKED_ROLE), user1.address);

        await expect(
          singleMint(erc20, minter, user1.address, 2)
        ).to.revertedWith("Blocked user");
      });
    });

    describe("batch minting checksum", () => {
      it("fails for wrong address", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address],
              [1],
              1,
              getMintChecksum([user2.address], [1], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("fails for wrong amount", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address],
              [1],
              1,
              getMintChecksum([user1.address], [2], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("fails for wrong id", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address],
              [1],
              1,
              getMintChecksum([user1.address], [1], 0)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("fails for empty address", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet([user1.address], [1], 1, getMintChecksum([], [2], 1))
        ).to.revertedWith("Checksum mismatch");
      });

      it("fails for empty amount", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address],
              [1],
              1,
              getMintChecksum([user1.address], [], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("multi-mint fails for wrong minting order", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address, user2.address],
              [1, 2],
              1,
              getMintChecksum([user2.address, user1.address], [2, 1], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("multi-mint fails for too many targets", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address, user2.address],
              [1, 2],
              1,
              getMintChecksum(
                [user1.address, user2.address, userWithTokens.address],
                [1, 2, 3],
                1
              )
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("multi-mint fails for too few targets", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address, user2.address],
              [1, 2],
              1,
              getMintChecksum([user1.address], [1, 2], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("multi-mint fails for too many amounts", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address, user2.address],
              [1, 2],
              1,
              getMintChecksum([user1.address, user2.address], [1, 2, 3], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });

      it("multi-mint fails for too few amounts", async () => {
        await expect(
          erc20
            .connect(minter)
            .mintSet(
              [user1.address, user2.address],
              [1, 2],
              1,
              getMintChecksum([user1.address, user2.address], [1], 1)
            )
        ).to.revertedWith("Checksum mismatch");
      });
    });
  });

  describe("Token rescue", () => {
    it("rescues successfully", async () => {
      await dummytoken.connect(proxyOwner).transfer(erc20.address, 6);

      await erc20
        .connect(rescuer)
        .rescueERC20(dummytoken.address, user1.address, 4);

      await expect(await dummytoken.balanceOf(user1.address)).to.equal(4);
      await expect(await dummytoken.balanceOf(erc20.address)).to.equal(2);
    });

    it("failing token rescue...fails", async () => {
      const mockContract = await deployMockContract(
        user1,
        MockERC20__factory.abi
      );
      await mockContract.mock.transfer.revertsWithReason("Mock revert");

      await expect(
        erc20
          .connect(rescuer)
          .rescueERC20(mockContract.address, user1.address, 4)
      ).to.revertedWith("Mock revert");
    });
  });

  describe("Upgradability", () => {
    it("original is initialized", async () => {
      const a = user1.address;
      await expect(erc20.initialize(a, a, a, a, a, a, a, a)).to.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("v2 without proxy is deployed", async () => {
      expect(await erc20v2.isThisNewVersion()).to.true;
    });

    it("can be upgraded", async () => {
      const oldImpl = await erc20.getImplementation();
      await erc20.connect(proxyOwner).upgradeTo(erc20v2.address);
      const newImpl = await erc20.getImplementation();

      expect(oldImpl).to.not.equal(newImpl);
    });
  });

  describe("Other", () => {
    it("sending Eth to the contract fails", async () => {
      await expect(
        user1.sendTransaction({ to: erc20.address, value: 5 })
      ).to.revertedWith(
        "Transaction reverted: function selector was not recognized and there's no fallback nor receive function"
      );
    });

    it("sending contract's own tokens to the contract fails", async () => {
      await expect(
        erc20.connect(userWithTokens).transfer(erc20.address, 1)
      ).to.revertedWith("Blocked user");
    });
  });
});
