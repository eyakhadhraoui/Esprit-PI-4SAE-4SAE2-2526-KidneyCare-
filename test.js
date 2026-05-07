import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 5,
    duration: '10s',
};

export default function () {
    const url = __ENV.BASE_URL || 'http://foncgreffon_app:8089';
    http.get(url);
    sleep(1);
}
