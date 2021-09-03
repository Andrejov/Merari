import ActivityExtension from "./Extensions/ActivityExtension";
import AdministrativeExtension from "./Extensions/AdministrativeExtension";
import FunExtension from "./Extensions/FunExtension";
import MinesweeperExtension from "./Extensions/Minesweeper";
import UtilityExtension from "./Extensions/UtilityExtension";
import Merari from "./Merari/Merari";
import Version from "./Merari/Util/Version";

const bot = new Merari();

bot.extensionManager.add(ActivityExtension)
bot.extensionManager.add(FunExtension);
bot.extensionManager.add(AdministrativeExtension)
bot.extensionManager.add(UtilityExtension)
bot.extensionManager.add(MinesweeperExtension)

bot.on('login', () => {
    bot.extensionManager.get(ActivityExtension).name = `Running v.${Version.get()}`;
})

bot.run();