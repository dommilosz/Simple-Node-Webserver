import compression from "compression"
import {server} from "../../webserver";
server.use(compression())