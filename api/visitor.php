<?php

header("Content-Type: application/json");

echo json_encode([
    "today" => 0,
    "totalVisits" => 0,
    "totalVisitors" => 0,
    "online" => 0
]);

?>